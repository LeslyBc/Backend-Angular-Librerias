'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs'); //librería de hasheo

var UsuariosSchema = Schema({
    nombre: String,
    apellido: String,
    cedula: String,
    correo: String,
    contrasenia: String, 
    imagen: String,
    
    favoritos: [{ type: Schema.Types.ObjectId, ref: 'Libros' }]
});


//Hashear la contraseña antes de guardar
UsuariosSchema.pre('save', async function(next) {
    const usuario = this;
    // Solo se hashea si la contraseña ha sido modificada o es nueva
    if (!usuario.isModified('contrasenia')) {
        return next();
    }
    try {
        // salt: la "semilla" para el hasheo
        const salt = await bcrypt.genSalt(10);
        // Hashear la contraseña y reemplazar el valor en el esquema
        usuario.contrasenia = await bcrypt.hash(usuario.contrasenia, salt);
        next();
    } catch (error) {
        next(error);
    }
});

//Se usa en el controlador para verificar
UsuariosSchema.methods.compararContrasena = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.contrasenia);
};

module.exports = mongoose.model('Usuarios', UsuariosSchema);