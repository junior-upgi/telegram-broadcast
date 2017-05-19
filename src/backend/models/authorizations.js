module.exports = (sequelize, DataTypes) => {
    const Authorizations = sequelize.define('authorizations', {
        loginId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reference: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
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
            singular: 'authorization',
            plural: 'authorizations'
        }
    });
    return Authorizations;
};
