import sequelize from "./database.js";
import {DataTypes} from "sequelize";

// To-Do Model

const Todo = sequelize.define("Todo", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "The title cannot be empty."
            },
            len: {
                args: [1, 255],
                msg: "The title must be between 1 and 255 characters long."
            }
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("todo", "in-progress", "done", "archived"),
        allowNull: false,
        defaultValue: "todo",
        validate: {
            isIn: {
                args: [["todo", "in-progress", "done", "archived"]],
                msg: "The status must be one of: 'todo', 'in-progress', 'done', 'archived'."
            }
        }
    },
    priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: true,
        validate: {
            isIn: {
                args: [["low", "medium", "high"]],
                msg: "The priority must be one of: 'low', 'medium', 'high'."
            }
        }
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: {
                args: true,
                msg: "The deadline must be a valid date."
            }
        }
    }
}, {
    timestamps: true
});


export const seedTodos = async () => {
    try {
        const count = await Todo.count();

        if (count === 0) {
            const todoArray = [
                {
                    title: "Buy groceries",
                    content: "Milk, Bread, Eggs, Butter",
                    status: "todo",
                    priority: "medium",
                    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
                },
                {
                    title: "Finish project report",
                    content: "Complete the final report for the project and submit it to the manager.",
                    status: "in-progress",
                    priority: "high",
                    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
                },
                {
                    title: "Call plumber",
                    content: "Fix the leaking sink in the kitchen.",
                    status: "done",
                    priority: "low",
                    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                },
                {
                    title: "Plan weekend trip",
                    content: "Research destinations and book accommodations for the weekend getaway.",
                    status: "archived",
                    priority: "medium",
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                }
            ]

            await Todo.bulkCreate(todoArray);
            console.log("Sample To-Do items have been seeded.");
        } else {
            console.log("To-Do items already exist. Skipping seeding.");
        }
    }

    catch (error) {
        console.error("Error seeding To-Do items:", error);
        throw error;
    }
}

export default Todo;