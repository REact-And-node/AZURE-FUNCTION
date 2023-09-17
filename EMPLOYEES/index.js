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
                const decoded = jwt.verify(token, process.env.secretKey); // Replace 'your-secret-key' with your actual secret key
                
                // You can perform additional checks on the decoded token if needed
                // For example, check if the token has expired or if it contains valid user information
                
                return decoded;
            } catch (error) {
                // If the token verification fails, return null or throw an error
                return null;
            }
        }
        
    console.log("user",user)
        
          
  
          if (!user) {
              context.res = {
                  status: 401,
                  body: 'Unauthorized: Invalid token'
              };
              return;
          }
  
        const database = await mongoClient.connect();
        const collection = database.db(process.env.MONGODB_ATLAS_DATABASE).collection(process.env.MONGODB_ATLAS_COLLECTION);

        if (req.method === 'GET') {
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
              
               var sort={}
                sort[field]=order=='asc' ?1:-1
            }
            
            // Pagination
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const skip = (page - 1) * pageSize;
            
            // Read operation with querying options
            const results = await collection.find(queryOptions)
            .sort(sort)  // Apply sorting
            .skip(skip)              // Apply skipping
            .limit(pageSize)         // Apply limiting
            .toArray();
         
                // console.log("Results:", results);
          if (results.length === 0) {
        context.res = {
            status: 404, // Not Found
            headers: {
                "Content-Type": "application/json"
            },
            body: {
                message: "No data found"
            }
        };
    } else {
        context.res = {
            headers: {
                "Content-Type": "application/json"
            },
            body: results
        };
    }
        } 
        
        
        else if (req.method === 'POST') {
            // Create operation
            const newItem = req.body; // Assuming req.body contains the data for the new item
        
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
        else if (req.method === 'PUT') {
            // Update operation
            const updatedItem = req.body; // Assuming req.body contains the updated data
            const filter = {emp_no: updatedItem.emp_no}; // Assuming you are updating by emp_no
            const { error } = updateSchema.validate(updatedItem);
          const result = await collection.replaceOne(filter, updatedItem);
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
    
          else  if (result.modifiedCount === 0) {
                context.res = {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: {
                        message: "Record not found"
                    }
                };
            } else {
                context.res = {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: {
                        message: "Record updated successfully",
                        data: result.modifiedCount
                    }
                    }
                    }
        }
        else if (req.method === 'DELETE') {
            // Delete operation
            const emp_no=parseInt(req.query.emp_no)
         
            // Validate the input data (emp_no ID)
            if (!emp_no) {
                context.res = {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: {
                        message: "Item ID (id) not provided in the query"
                    }
                };
                return;
            }
        
           
            // Attempt to delete the specified record
            const result = await collection.deleteOne({emp_no:emp_no})
       
        console.log('emp_no:',emp_no)
            if (result.deletedCount === 0) {
                context.res = {
                    status: 404, // Not Found
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: {
                        message: "Record not found",result
                    }
                };
            } else {
                context.res = {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: {
                        message: "Item deleted successfully ",emp_no,
                        data: result.deletedCount
                    }
                };
            }
        }
        
        
        else {
            context.res = {
                status: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: {
                    message: "Unsupported HTTP method"
                }
            };
        }
    } catch (error) {
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
