import mongoose from 'mongoose';

export const connectDB = async () : Promise<typeof mongoose> => {
    mongoose.connection.on('connected', () => console.log('Mongoose connection is open.'));
    mongoose.connection.on('error', err => console.error(`Mongoose connection error has occurred: ${err}`));
    mongoose.connection.on('disconnected', () => console.log('Mongoose connection is disconnected.'));

    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log('Mongoose connection is disconnected due to application termination.');
            process.exit(0);
        });
    });
  
    console.log('Establishing a Mongoose connection');
    console.log(process.env.DB_CONNECTION_STRING);
    return mongoose.connect(process.env.DB_CONNECTION_STRING || '', {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    });
};