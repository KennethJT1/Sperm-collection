import bcrypt from 'bcrypt';
import jwt, {JwtPayload} from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { UserPayload } from '../interface';


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