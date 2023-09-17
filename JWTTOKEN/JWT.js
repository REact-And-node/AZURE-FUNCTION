const jwt = require('jsonwebtoken');

module.exports = async function (context, req) {
 
 
    const secretKey = "jwt-token"; 
    
    // Create a JWT
    const payload = {
        username: 'nafish',
        role: 'admin@test.com',
    };

    const token = jwt.sign(payload, secretKey, { expiresIn: '2h' });

    context.res = {
        body: { token },
    };
};
