'use strict'

var express = require('express');
var router = express.Router();
var usuariosController = require('../Controller/usuariosController');
var multiparty = require('connect-multiparty'); 
var multiPartyMiddleware = multiparty({ uploadDir: './uploads' });

var auth = require('../middlewares/auth');


router.get('/usuario/:id', usuariosController.verUsuario); // Usada para ver perfil
router.post('/guardar-usuarios', usuariosController.guardarUsuarios);

router.post('/cargar-imagenUsuario/:id', multiPartyMiddleware, usuariosController.cargarImagenUsuario);
router.get('/tener-imagenUsuario/:imagen', usuariosController.tenerImagenUsuario);

router.post('/login-usuario', usuariosController.loginUsuario);
router.post('/recuperar-contrasenia', usuariosController.recuperarContrasenia);

router.put('/usuario/:id/datos', usuariosController.actualizarDatos); 

// Ruta para CAMBIAR CONTRASEÑA 
router.put('/usuario/:id/contrasena', usuariosController.cambiarContrasenia);

// GET: Obtener la lista de favoritos del usuario logueado
router.get('/favoritos', auth, usuariosController.verFavoritos); 

router.put('/favorito/:libroId', auth, usuariosController.toggleFavorito);

module.exports = router;