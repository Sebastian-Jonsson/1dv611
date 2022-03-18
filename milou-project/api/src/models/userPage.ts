import createHttpError from 'http-errors';
import mongoose, { Document, Model, Schema } from 'mongoose';

export enum MeasureAt {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly'
}

export interface IUserPage extends Document {
    userID: string
    addressID: string
    measureAt: 'Daily' | 'Weekly' | 'Monthly'
}

export interface IUserPageModel extends Model<IUserPage> {
    findOrCreate(userId: string, pageId: string, interval: MeasureAt): Promise<IUserPage>
    getAllUserPages(userID: string): Promise<IUserPage[]>
    deletePageId(userID: string, addressID: string): Promise<void>
    updateAddressID(userID: string, previousID: string, newID: string, measureAt: MeasureAt): Promise<void>
    findUserIdsOfPage(addressID: string): Promise<string[]>
}

export const schema = new Schema({
    userID: { type: String, required: true },
    addressID: { type: String, required: true },
    measureAt: { 
        type: String, 
        enum: ['Daily', 'Weekly', 'Monthly'],
        trim: true,
        required: true
    }
}, {
    timestamps: true
});

schema.statics.findOrCreate = async function(userId: string, pageId: string, interval: MeasureAt): Promise<IUserPage> {
    try {
        const filter = { userID: userId, addressID: pageId };
        const newUserPage = {userID: userId, addressID: pageId, measureAt: interval};

        const userPage = await UserPage.findOne(filter);

        if (userPage) {
            throw createHttpError(400, { 
                message: {
                    detail: 'Page already added'
                }
            });
        }

        return await UserPage.create(newUserPage);

    } catch (error) {
        throw error;
    }
};

schema.statics.getAllUserPages = async function(userID: string): Promise<IUserPage[]> {
    try {
        const userPages = await UserPage.find({userID});

        if (userPages) {
            return userPages;
        }

        return [];
    } catch (error) {
        throw createHttpError(400);
    }
};

schema.statics.deletePageId = async function(userID: string, addressID: string): Promise<void> {
    try {
        const foundPage = await UserPage.findOne({userID: userID, addressID: addressID});

        if(foundPage){
            await UserPage.deleteOne({_id: foundPage._id});
        } else {
            throw new Error();
        }
    } catch (error) {
        throw createHttpError(400);
    }
};

schema.statics.updateAddressID = async function(userID: string, previousID: string, newID: string, measureAt: MeasureAt): Promise<void> {
    try {
        const pageAlreadyExistOnUser = await UserPage.findOne({ userID, addressID: newID});
        
        if (pageAlreadyExistOnUser) {
            throw createHttpError(400, { 
                message: {
                    detail: 'Cant update page to already existing page', 
                    addressID: newID
                }
            });
        }

        const updatedUserPage = await this.updateOne({userID: userID, addressID: previousID}, {
            addressID: newID,
            measureAt
        });

        if (updatedUserPage.nModified !== 1) {
            throw createHttpError(400, { 
                message: {
                    detail: `Failed to update page with id: ${previousID} to page with id: ${newID}` , 
                    addressID: previousID
                }
            });
        }
    } catch (error) {
        throw error;
    }
};

schema.statics.findUserIdsOfPage = async function(addressID: string): Promise<string[]> {
    try {
        const userPages = await UserPage.find({ addressID });
        
        return userPages.map((xd: IUserPage) => xd.userID);
    } catch (error) {
        throw createHttpError(400, 'Failed to update page');
    }
};

const UserPage: IUserPageModel = mongoose.model<IUserPage, IUserPageModel>('UserPage', schema);

export default UserPage;