'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs'); 

var UsuariosSchema = Schema({
    nombre: String,
    apellido: String,
    cedula: String,
    correo: String,
    contrasenia: String, 
    imagen: String,
    
    favoritos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Libros' // Nombre del modelo de libros
    }]
});

UsuariosSchema.pre('save', async function(next) {
    const usuario = this;
    if (!usuario.isModified('contrasenia')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        usuario.contrasenia = await bcrypt.hash(usuario.contrasenia, salt);
        next();
    } catch (error) {
    next(error);
    }
});

// Método para comparar la contraseña
UsuariosSchema.methods.compararContrasena = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.contrasenia);
};

module.exports = mongoose.model('Usuarios', UsuariosSchema);