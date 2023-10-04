const path =require('path')
const staticPath = path.join(__dirname, '../../public');
const registerSchema=require('../models/registerSchema')
const bcrypt = require('bcrypt');
const auth=require('../middleware/auth')
const jwt=require("jsonwebtoken")
const fs = require('fs');
const { log } = require('console');


exports.home = async (req, resp) => {
 resp.sendFile('html/home.html', { root: staticPath });
  };

  exports.registerPost = async (req, resp) => {
      try {
        const {name, email, password,confirmPassword}=req.body
        const checkemail = await registerSchema.findOne({ email })
    if (checkemail) {
        resp.status(405).json({ success: false, message: 'Email is already registered' })
      } else {
          if (password == confirmPassword) {
              const userdata = new registerSchema({
                name, email, password,confirmPassword
                })
          const token = await userdata.generateAuthToken()
          resp.cookie("jwt", token, {
            expires: new Date(Date.now() + 5259600000),
            httpOnly: true,
            sameSite: 'Strict'
          });
          const user = await userdata.save()
          resp.status(200).json({ success: true, message: 'register successful',user });
        } else {
          resp.status(401).json({ success: false, message: 'Password do not match' });
        }
      }
    } catch (error) {
      resp.status(401).json({ success: false, message: 'Please try again later' });
    }
};


// login ke liye
exports.loginPost= async (req,resp)=>{
    const email = req.body.email
  const password = req.body.password
  try {
    const useremail = await registerSchema.findOne({ email: email })
    const ismatch = await bcrypt.compare(password, useremail.password)
    const token = await useremail.generateAuthToken()
    if (ismatch) {
      resp.cookie("jwt", token, {
        expires: new Date(Date.now() + 5259600000),
        httpOnly: true,
        sameSite: 'Strict'
      });
      resp.status(200).json({ success: true, message: 'Login successful' });
    } else {
      resp.status(402).json({ success: false, message: 'Your Email or Password is incorrect' });
    }
  } catch (error) {
    console.log(error);
    resp.status(401).json({ success: false, message: 'Your Email or Password is incorrect' });
  }
}

exports.profileGet = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const verify = jwt.verify(token, process.env.secretKey);
    const user = await registerSchema.findOne({ _id: verify._id });

    const htmlFilePath = path.join(staticPath, 'html', 'profile.html');
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const renderedHtml = htmlContent.replace('{{name}}', user.name).replace('{{email}}', user.email).replace('{{money}}', user.money);
    resp.send(renderedHtml);
  } catch (error) {
    console.log(error);
    resp.status(402).json({ success: false, message: 'Please login or create an account' });
  }
};

exports.profilePost = async (req, resp) => {
  try {
    const token = req.cookies.jwt;
    const verify = jwt.verify(token, process.env.secretKey);
    const user = await registerSchema.findById(verify._id);
    if (!user) {
      return resp.status(401).send("User not found  you have to login or register.");
    }
    const { name,email, money } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (money) user.money = money;
      await user.save();

      resp.redirect('/profile');
      } catch (error) {
    console.error(error);
    resp.status(401).send('Login timeout. Please login.');
  }
};
