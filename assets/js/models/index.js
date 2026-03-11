import sequelize, { init as initDatabase } from "./database.js";
import Todo , { seedTodos } from "./Todo.js";


// Alle Modelle und Funktionen exportieren
export { sequelize, initDatabase, Todo, seedTodos };

// Standardexport für die gesamte Datenbankkonfiguration und Modelle
export default { sequelize, initDatabase, Todo, seedTodos };