const login = (req, res) => {
    res.send('Login endpoint');
}

const register = (req, res) => {
    res.send('Register endpoint');
}

export default {
    login, register
}