import mongoose from "mongoose";

export const clearTestDB = async (): Promise<void> => {
  const { collections } = mongoose.connection;

  const clearPromises = Object.values(collections).map((collection) =>
    collection.deleteMany({}),
  );

  await Promise.all(clearPromises);
};

export default clearTestDB;
