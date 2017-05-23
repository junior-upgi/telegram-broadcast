module.exports = (sequelize, DataTypes) => {
    const APISubscribers = sequelize.define('apiSubscribers', {
        reference: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        },
        loginId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: false
        },
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
            singular: 'apiSubscriber',
            plural: 'apiSubscribers'
        }
    });
    return APISubscribers;
};
