import Joi from 'joi';
import jwt, {JwtPayload} from 'jsonwebtoken';
import { JWT_SECRET } from '../config';



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


//This is used to format the message sent to the browser when there is an error
export const option = {
    abortearly: false,
    errors:{
        wrap:{
            label:''
        }
    }
}    

export const verifySignature = async (signature: string) => {
    return jwt.verify(signature, JWT_SECRET) as JwtPayload

}