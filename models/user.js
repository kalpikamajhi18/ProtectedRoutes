import mongoose from "mongoose";
import { lowercase, maxLength, minLength, required, trim } from "zod/mini";

const userCreate = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            maxLength: [100, 'Name cannot be more then 100 character']
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            unique: true
        },

        password: {
            type: String,
            trim: true,
            required: true,
            minLength: 8
        },

        refreshToken: { type: String, default: null },

    },

    { timestamps: true }
)


const userCreates = mongoose.model('user', userCreate);

export default userCreates;