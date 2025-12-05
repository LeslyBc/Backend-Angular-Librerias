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
    descripcion: String,
    favoritos_id: [{ type: Schema.Types.ObjectId, ref: 'Libros' }]
});

module.exports = mongoose.model('Usuarios', UsuariosSchema);