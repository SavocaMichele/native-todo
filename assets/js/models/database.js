import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./assets/js/models/database.sqlite",
    logging: false,
    define: {
        timestamps: true
    }
});


export const init = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection established successfully.");

        await sequelize.sync({ force: false });
        console.log("Models synchronized.");

        return true;
    }

    catch (error) {
        console.error("Error connecting to the database:", error);
        throw error;
    }
}

export default sequelize;