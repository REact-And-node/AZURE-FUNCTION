const MongoClient = require("mongodb").MongoClient;
const Joi = require("joi");

const mongoClient = new MongoClient(process.env.MONGODB_ATLAS_URI);

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
        const decoded = jwt.verify(token, process.env.secretKey); // Replace 'your-secret-key' with your actual secret key

        // You can perform additional checks on the decoded token if needed
        // For example, check if the token has expired or if it contains valid user information

        return decoded;
      } catch (error) {
        // If the token verification fails, return null or throw an error
        return null;
      }
    };

    console.log("user", user);

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

    const emp_no = parseInt(req.query.emp_no);

    // Validate the input data (emp_no ID)
    if (!emp_no) {
      context.res = {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "Item ID (id) not provided in the query",
        },
      };
      return;
    }

    // Attempt to delete the specified record
    const result = await collection.deleteOne({ emp_no: emp_no });

    console.log("emp_no:", emp_no);
    if (result.deletedCount === 0) {
      context.res = {
        status: 404, // Not Found
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "Record not found",
          result,
        },
      };
    } else {
      context.res = {
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "Item deleted successfully ",
          emp_no,
          data: result.deletedCount,
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
