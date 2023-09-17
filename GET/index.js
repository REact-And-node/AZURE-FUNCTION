const MongoClient = require("mongodb").MongoClient;

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
        const decoded = jwt.verify(token, process.env.secretKey);

        return decoded;
      } catch (error) {
        // If the token verification fails, return null or throw an error
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

    // Querying Options
    const queryOptions = {};

    // Filtering
    if (req.query.filter) {
      // Assuming you pass a filter parameter in the query like "?filter=fieldName:value"
      const [field, value] = req.query.filter.split(":");
      queryOptions[field] = value;
    }

    // Sorting
    if (req.query.sort) {
      // Assuming you pass a sort parameter in the query like "?sort=fieldName:asc" or "?sort=fieldName:desc"
      const [field, order] = req.query.sort.split(":");
      console.log("Sorting Field:", field);
      console.log("Sorting Order:", order);

      console.log("Sorting Order:", queryOptions);

      var sort = {};
      sort[field] = order == "asc" ? 1 : -1;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    // Read operation with querying options
    const results = await collection
      .find(queryOptions)
      .sort(sort) // Apply sorting
      .skip(skip) // Apply skipping
      .limit(pageSize) // Apply limiting
      .toArray();

    // console.log("Results:", results);
    if (results.length === 0) {
      context.res = {
        status: 404, // Not Found
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          message: "No data found",
        },
      };
    } else {
      context.res = {
        headers: {
          "Content-Type": "application/json",
        },
        body: results,
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
