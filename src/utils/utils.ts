import bcrypt from 'bcrypt';
import Joi from 'joi';
import jwt, {JwtPayload} from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { UserPayload } from '../interface';


//Users registration
export const registerSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(5),
})

export const clientSchema = Joi.object().keys({
    image: Joi.string().required(),
    height: Joi.string().required(),
    age: Joi.number().required(),
    weight: Joi.string().required(),
    bloodGroup: Joi.string().required(),
    genotype: Joi.string().required(),
    address: Joi.string().required(),
    role: Joi.string().required(),
})

export const loginSchema = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(5),
})

//This is used to format the message sent to the browser when there is an error
export const option = {
    abortearly: false,
    errors:{
        wrap:{
            label:''
        }
    }
}

//Generate a salt
export const GenerateSalt = async() => {
    return await bcrypt.genSalt()
}




export const GenerateSignature = async (payload: UserPayload)=> {
    return jwt.sign(payload, JWT_SECRET, {expiresIn: '1d'})

}      

export const verifySignature = async (signature: string) => {
    return jwt.verify(signature, JWT_SECRET) as JwtPayload

}