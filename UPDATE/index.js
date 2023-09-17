const MongoClient = require("mongodb").MongoClient;
const Joi = require("joi");

const mongoClient = new MongoClient(process.env.MONGODB_ATLAS_URI);

const updateSchema = Joi.object({
  emp_no: Joi.number().integer().required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  birth_date: Joi.date().iso().required(),
  gender: Joi.string().valid("M", "F").required(),
  hire_date: Joi.date().iso().required(),
});

module.exports = async function (context, req) {
  try {
    // Ensure that a valid JWT token is provided in the request header
    const authHeader = req.headers["authorization"];
    console.log("Auth Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      context.res = {
        status: 401,
        body: "Unauthorized: Missing or invalid token",
      };
      return;
    }

    // Extract and verify the JWT token
    const token = authHeader.split(" ")[1];
    console.log("Token:", token);

    // Verify the token
    const user = async function verifyToken(token) {
      try {
        // Verify the JWT token using a secret or public key
        const decoded = jwt.verify(token, process.env.secretKey);
        return decoded;
      } catch (error) {
        return null;
      }
    };

    if (!user) {
      context.res = {
        status: 401,
        body: "Unauthorized: Invalid token",
      };
      return;
    }

    const database = await mongoClient.connect();
    const collection = database
      .db(process.env.MONGODB_ATLAS_DATABASE)
      .collection(process.env.MONGODB_ATLAS_COLLECTION);

    // Update operation
     // Assuming req.body contains the updated data
    const emp_no =parseInt(req.query.emp_no)
    const updatedItem = {...req.body,emp_no:emp_no }  // Assuming req.body contains the updated data
    const filter = { emp_no: updatedItem.emp_no }; // Assuming you are updating by emp_no
    const { error } = updateSchema.validate(updatedItem);
    const result = await collection.replaceOne(filter, updatedItem);
    if (error) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: error.details[0].message,
        },
      };
      return;
    } else if (result.modifiedCount === 0) {
      context.res = {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "Record not found",
        },
      };
    } else {
      context.res = {
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "Record updated successfully",
          data: result.modifiedCount,
        },
      };
    }
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: error.toString(),
      },
    };
  } finally {
    await mongoClient.close();
  }
};
