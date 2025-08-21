export class AppError extends Error {
    statusCode: number;
    code: string;
    
    constructor(message: string, statusCode = 500, code = "SERVER ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;

        //Ensures correct prototype chain
        Object.setPrototypeOf(this, AppError.prototype)
    }
}