'use strict'

var express = require('express');
var router = express.Router();
var usuariosController = require('../Controller/usuariosController');
var multiparty = require('connect-multiparty');
var multiPartyMiddleware = multiparty({ uploadDir: './uploads' });

router.get('/usuarios', usuariosController.verUsuarios);
router.get('/usuario/:id', usuariosController.verUsuario); // Usada para ver perfil
router.post('/guardar-usuarios', usuariosController.guardarUsuarios);
router.delete('/usuario/:id', usuariosController.deleteUsuarios);
router.post('/cargar-imagenUsuario/:id', multiPartyMiddleware, usuariosController.cargarImagenUsuario);
router.get('/tener-imagenUsuario/:imagen', usuariosController.tenerImagenUsuario);

router.post('/login-usuario', usuariosController.loginUsuario);
router.post('/recuperar-contrasenia', usuariosController.recuperarContrasenia);

router.put('/usuario/:id/datos', usuariosController.actualizarDatos); 

// Ruta para CAMBIAR CONTRASEÑA 
router.put('/usuario/:id/contrasena', usuariosController.cambiarContrasena); 

module.exports = router;