module.exports = (sequelize, DataTypes) => {
    const Chats = sequelize.define('chats', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        all_members_are_administrators: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        /* // deprecated after using the tgfancy library
        update_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        */
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        name: {
            singular: 'chat',
            plural: 'chats'
        }
    });
    return Chats;
};
