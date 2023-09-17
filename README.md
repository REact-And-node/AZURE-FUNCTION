
# AZURE-FUNCTION

Sure, I'll explain each part of the code step by step:

1. Importing Required Modules:
   ```javascript
   const MongoClient = require("mongodb").MongoClient;
 

2. Creating a MongoDB Client:
   ```javascript
   const mongoClient = new MongoClient(process.env.MONGODB_ATLAS_URI);
   ```
   - This line creates a new instance of the `MongoClient` using the MongoDB Atlas URI provided via the environment variable `MONGODB_ATLAS_URI`.

3. Exporting a Function:
   ```javascript
   module.exports = async function (context, req) {
     // ...
   };
   ```
   - This code exports an asynchronous function that will serve as an Azure Function. It takes two parameters: `context` and `req`, which represent the execution context and the HTTP request object, respectively.

4. JWT Token Authentication:
   ```javascript
   const authHeader = req.headers["authorization"];
   ```
   - It extracts the `Authorization` header from the HTTP request, which typically contains a JWT token.

   ```javascript
   if (!authHeader || !authHeader.startsWith("Bearer")) {
     context.res = {
       status: 401,
       body: "Unauthorized: Missing or invalid token",
     };
     return;
   }
   ```
   - It checks if the `Authorization` header exists and starts with "Bearer." If not, it returns a 401 Unauthorized response.

   ```javascript
   const token = authHeader.split(" ")[1];
   ```
   - It extracts the JWT token from the `Authorization` header.

   ```javascript
   const user = async function verifyToken(token) {
     // ...
   };
   ```
   - It defines an asynchronous function called `verifyToken` that is intended to verify the JWT token. The actual implementation of this function is missing from the code you provided.

   ```javascript
   if (!user) {
     context.res = {
       status: 401,
       body: "Unauthorized: Invalid token",
     };
     return;
   }
   ```
   - It checks the result of the `verifyToken` function. If it returns a falsy value (e.g., null), it indicates that the token is invalid, and a 401 Unauthorized response is sent.

5. MongoDB Connection Setup:
   ```javascript
   const database = await mongoClient.connect();
   ```
   - It establishes a connection to the MongoDB database specified in the `MONGODB_ATLAS_URI` and stores it in the `database` variable.

   ```javascript
   const collection = database
     .db(process.env.MONGODB_ATLAS_DATABASE)
     .collection(process.env.MONGODB_ATLAS_COLLECTION);
   ```
   - It gets a reference to the desired MongoDB collection based on the values of `MONGODB_ATLAS_DATABASE` and `MONGODB_ATLAS_COLLECTION` environment variables.

6. Input Data Validation:
   ```javascript
   const emp_no = parseInt(req.query.emp_no);
   ```
   - It parses an integer from the `emp_no` query parameter in the HTTP request.

   ```javascript
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
   ```
   - It checks if `emp_no` is falsy (e.g., not provided or not a valid number) and returns a 400 Bad Request response with an error message if so.

7. Deleting a Record from MongoDB:
   ```javascript
   const result = await collection.deleteOne({ emp_no: emp_no });
   ```
   - It attempts to delete a record from the MongoDB collection where `emp_no` matches the provided value.

   ```javascript
   if (result.deletedCount === 0) {
     // ...
   } else {
     // ...
   }
   ```
   - It checks the `deletedCount` property in the `result` object to determine whether a record was successfully deleted.

8. Handling Response:
   - If no record was deleted (`result.deletedCount === 0`), it returns a 404 Not Found response.
   - If a record was deleted, it returns a 200 OK response with a success message and data about the deleted item.

9. Error Handling:
   ```javascript
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
   }
   ```
   - It catches any errors that occur during the execution and returns a 500 Internal Server Error response with an error message.

10. Closing MongoDB Connection:
   ```javascript
   } finally {
     await mongoClient.close();
   }
   ```
   - It ensures that the MongoDB connection is closed, whether the operation succeeds or fails. This is important to release resources and prevent memory leaks.
