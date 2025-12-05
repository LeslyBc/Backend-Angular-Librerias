'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LibrosSchema = Schema({
    titulo: String,
    descripcion: String,
    genero: String,
    portada: String,
    anio_publicacion: Number,
    idioma: String,
    cantidad_disponible: Number,
    autor: String,
    ubicacion: String,
    favorito: {type: Boolean, default: false}
});

module.exports = mongoose.model('Libros', LibrosSchema);