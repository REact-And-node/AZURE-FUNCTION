const MongoClient = require("mongodb").MongoClient;
const Joi = require('joi');

const mongoClient = new MongoClient(process.env.MONGODB_ATLAS_URI);

const updateSchema = Joi.object({
    emp_no: Joi.number().integer().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    birth_date: Joi.date().iso().required(),
    gender: Joi.string().valid('M', 'F').required(),
    hire_date: Joi.date().iso().required()
});


/**
 * Handles HTTP requests and performs CRUD operations on a MongoDB database.
 * Includes authentication using JWT tokens and validation of request data using a Joi schema.
 *
 * @param {object} context - The Azure Function context object.
 * @param {object} req - The HTTP request object.
 * @returns {object} - The response object with status, headers, and body properties.
 *
 * @throws {Error} - If any error occurs during the execution of the function.
 */
module.exports = async function (context, req) {
    try {

          // Ensure that a valid JWT token is provided in the request header
          const authHeader = req.headers['authorization'];
          console.log('Auth Header:', authHeader);
  
          if (!authHeader || !authHeader.startsWith('Bearer')) {
              context.res = {
                  status: 401,
                  body: 'Unauthorized: Missing or invalid token'
              };
              return;
          }
  
          // Extract and verify the JWT token
           const token = authHeader.split(' ')[1];
          console.log('Token:', token);
          
          // Verify the token
        const user =  async function verifyToken(token) {
            try {
                // Verify the JWT token using a secret or public key
                const decoded = jwt.verify(token, process.env.secretKey); 
                
                return decoded;
            } catch (error) {
                // If the token verification fails, return null or throw an error
                return null;
            }
        }
       if (!user) {
              context.res = {
                  status: 401,
                  body: 'Unauthorized: Invalid token'
              };
              return;
          }
  
        const database = await mongoClient.connect();
        const collection = database.db(process.env.MONGODB_ATLAS_DATABASE).collection(process.env.MONGODB_ATLAS_COLLECTION);

       
        // Assuming req.body contains the data for the new item
            const newItem = req.body;
        
            // Find the last person's emp_no and increment it by 1

            const lastPerson = await collection.findOne({}, { sort: { emp_no: -1 } });
        
            if (lastPerson) {
                newItem.emp_no = lastPerson.emp_no + 1;
            } else {
                // If there are no existing records, you can set an initial value for emp_no

                newItem.emp_no = 1;
            }

        
            
            const { error } = updateSchema.validate(newItem);
            const result = await collection.insertOne(newItem);
               if (error) {
                  context.res = {
                      status: 400,
                      headers: {
                          "Content-Type": "application/json"
                      },
                      body: {
                          message: error.details[0].message
                      }
                  };
                  return;
              }
              else{
            context.res = {
                headers: {
                    "Content-Type": "application/json"
                },
                body: {
                    message: "Item created successfully",
                    data: result
                }
            };
        
        }
         
     
    
    } 
    catch (error) {
        context.res = {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: {
                message: error.toString()
            }
        };
    } finally {
        await mongoClient.close();
    }
};
