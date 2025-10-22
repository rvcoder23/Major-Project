const bcrypt = require('bcryptjs');

// Password encryption utility
const encryptPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Password verification utility
const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
    encryptPassword,
    verifyPassword
};
