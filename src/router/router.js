const express = require('express')
const router=express.Router()
const auth=require('../middleware/auth')
const controller=require('../controller/controller')

router.get('/', controller.home)
router.post('/', controller.registerPost)
router.post('/login', controller.loginPost)
router.get('/profile',auth, controller.profileGet)
router.post('/profile', auth,controller.profilePost)




module.exports=router

