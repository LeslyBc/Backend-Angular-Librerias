'use strict'

var Usuarios = require('../models/usuarios');
var path = require('path');
var fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { match } = require('assert');

var controller = {

    home: (req, res) => res.status(200).send("<h1>Home</h1>"),


    // Función para obtener datos del perfil   3
    verUsuario: function (req, res) {
        var usuarioId = req.params.id;

        Usuarios.findById(usuarioId)
            .then(usuario => {
                if (!usuario) return res.status(404).send({ message: 'El usuario con esta ID no existe' })
                return res.status(200).send({ usuario })
            })
            .catch(err => {
                if (err.name === 'CastError') {
                    return res.status(404).send({ message: 'El id no es válido' });
                }
                return res.status(500).send({ message: 'Error al recuperar los datos', error: err });
            });
    },

    guardarUsuarios: async function (req, res) {
        var usuario = new Usuarios;
        var params = req.body;

        usuario.nombre = params.nombre;
        usuario.apellido = params.apellido;
        usuario.cedula = params.cedula;
        usuario.correo = params.correo;
        usuario.imagen = null;

        if (params.contrasenia) {
            usuario.contrasenia = await bcrypt.hash(params.contrasenia, 10);
        }

        usuario.save() //Guarda el nuevo doc en la base de datos
            .then(usuarioGuardado => res.status(200).send({ usuario: usuarioGuardado })) //si se guarda bien, dará un code 200 y devolverá el usuario guardado
            .catch(err => res.status(500).send({ message: 'Error al guardar', error: err })); //error de código interno
    },


    // Función de lógica para actualizar nombre, apellido, correo y descripcion
    actualizarDatos: async function (req, res) {
        var usuarioId = req.params.id;
        var { nombre, apellido, correo, descripcion } = req.body;

        try {
            let usuario = await Usuarios.findById(usuarioId);
            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            if (nombre) usuario.nombre = nombre;
            if (apellido) usuario.apellido = apellido;
            if (correo) usuario.correo = correo;
            if (descripcion !== undefined) usuario.descripcion = descripcion;

            const usuarioActualizado = await usuario.save();
            usuarioActualizado.contrasenia = undefined;

            return res.status(200).send({
                message: 'Datos actualizados correctamente',
                usuario: usuarioActualizado
            });

        } catch (error) {
            console.error("ERROR ACTUALIZAR DATOS:", error);
            return res.status(500).send({ message: 'Error al actualizar los datos', error });
        }
    },

    toggleFavorito: function (req, res) {
        var userId = req.usuario.id;
        var libroId = req.params.libroId;

        Usuarios.findById(userId)
            .then(usuario => {
                if (!usuario) {
                    return res.status(404).send({ message: 'Usuario no encontrado' });
                }

                var esFavorito = usuario.favoritos_id.includes(libroId);
                var updateQuery, mensaje;

                if (esFavorito) {
                    updateQuery = { $pull: { favoritos_id: libroId } };
                    mensaje = 'Libro eliminado de favoritos';
                } else {
                    updateQuery = { $addToSet: { favoritos_id: libroId } };
                    mensaje = 'Libro añadido a favoritos';
                }

                return Usuarios.findByIdAndUpdate(userId, updateQuery, { new: true })
                    .then(usuarioActualizado => {
                        if (!usuarioActualizado)
                            return res.status(400).send({ message: 'No se pudo actualizar el usuario' })

                        return res.status(200).send({message: mensaje, usuario: usuarioActualizado})
                    });
            })
            .catch(err => {
                if (err.name === 'CastError') {
                    return res.status(404).send({ message: 'ID de usuario o libro inválido' });
                }
                return res.status(500).send({ message: 'Error al procesar la solicitud', error: err });
            });
    },



    //Obtener la lista completa de libros favoritos (con datos del libro)
    verFavoritos: function (req, res) {
        var userId = req.usuario.id;

        Usuarios.findById(userId)
        .populate('favoritos_id')
        .then(usuario => {
            if (!usuario) {
                return res.status(404).send({ message: 'Usuario no encontrado.' });
            }
            return res.status(200).send(usuario.favoritos_id);

        })
        .catch(err => {
            if (err.name === 'CastError') {
                return res.status(404).send({ message: 'El ID de usuario es incorrecto' });
            }
            return res.status(500).send({ message: 'Error al obtener la lista de favoritos.', error: err });
        });
},



    // Función para cambiar la contraseña 
    cambiarContrasenia: async function (req, res) {
        const usuarioId = req.params.id;
        const { contraseniaActual, nuevaContrasenia } = req.body;

        if (!contraseniaActual || !nuevaContrasenia) {
            return res.status(400).send({ message: 'Faltan la contraseña actual o la nueva contraseña.' });
        }

        try {
            const usuario = await Usuarios.findById(usuarioId);
            if (!usuario) {
                return res.status(404).send({ message: 'Usuario no encontrado' });
            }

            //Verificar la contraseña actual
            const isMatch = await bcrypt.compare(contraseniaActual, usuario.contrasenia);
            if (!isMatch) {
                return res.status(400).send({ message: 'La contraseña actual es incorrecta' });
            }

            //Aplicar la nueva contraseña
            usuario.contrasenia = nuevaContrasenia;

            await usuario.save();

            return res.status(200).send({ message: 'Contraseña actualizada correctamente' });

        } catch (error) {
            console.error("ERROR CAMBIAR CONTRASEÑA:", error);
            return res.status(500).send({ message: 'Error al cambiar la contraseña', error });
        }
    },

    cargarImagenUsuario: function (req, res) {
        var usuarioId = req.params.id;
        var fileName = 'Imagen no subida'

        if (req.files) {
            var filePath = req.files.imagen.path;
            var file_split = filePath.split('\\');
            var fileName = file_split[file_split.length - 1];

            var extSplit = fileName.split('\.');
            var fileExt = extSplit[extSplit.length - 1];

            if (fileExt == 'png' || fileExt == 'jpg' || fileExt == 'jpeg' || fileExt == 'gif') {
                Usuarios.findByIdAndUpdate(usuarioId, { imagen: fileName }, { new: true })
                    .then(usuarioActualizado => {
                        if (!usuarioActualizado) {
                            fs.unlink(filePath, (unlinkErr) => {
                                return res.status(404).send({ message: 'El usuario no existe, no se subió la imagen' });
                            });
                        } else {
                            return res.status(200).send({ usuario: usuarioActualizado });
                        }
                    })

                    .catch(err => {
                        fs.unlink(filePath, (unlinkErr) => {
                            if (unlinkErr) console.error('Error al eliminar el archivo temporal', unlinkErr);
                            if (err.name === 'CastError') {
                                return res.status(404).send({ message: 'El Id no es válido' })
                            }
                            return res.status(500).send({ message: 'Error al recuperar datos', error: err });
                        });
                    });
            } else {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error al eliminar el archivo con ext no válida', err)
                    return res.status(200).send({ message: "La extensión no es válida, archivo eliminado" });
                });
            }
        } else {
            return res.status(400).send({ message: 'No se subió ninguna imagen' })
        }
    },

    tenerImagenUsuario: function (req, res) {
        var file = req.params.imagen;
        var path_file = path.join(__dirname, '../uploads', file);

        fs.stat(path_file, function (err, stats) {
            if (!err && stats.isFile()) {
                return res.sendFile(path.resolve(path_file));
            } else {
                return res.status(404).send({ message: 'La imagen no existe' });
            }
        });
    },

    loginUsuario: async function (req, res) {
        let { correo, contrasenia } = req.body;

        try {
            if (correo) correo = correo.trim().toLowerCase();
            if (contrasenia) contrasenia = contrasenia.trim();

            const usuario = await Usuarios.findOne({ correo });
            if (!usuario) {
                return res.status(400).send({ message: 'Correo no registrado' });
            }

            // Usamos bcrypt.compare para verificar la contraseña hasheada
            const passwordCorrecta = await bcrypt.compare(contrasenia, usuario.contrasenia);

            if (!passwordCorrecta) {
                return res.status(400).send({ message: 'Contraseña incorrecta' });
            }

            const token = jwt.sign(
                {
                    id: usuario._id,
                    correo: usuario.correo,
                    rol: 'usuario'
                },
                "adriel",
                { expiresIn: "4h" }
            );
            
            return res.status(200).send({
                message: "login exitoso",
                token,
                usuario
            });

        } catch (error) {
            console.error("ERROR LOGIN USUARIO:", error);
            return res.status(500).send({ message: "Error en login", error });
        }
    },

    recuperarContrasenia: async function (req, res) {
        let { correo, nuevaContrasenia } = req.body;

        try {
            if (correo) correo = correo.trim().toLowerCase();
            if (nuevaContrasenia) nuevaContrasenia = nuevaContrasenia.trim();

            const usuario = await Usuarios.findOne({ correo });
            if (!usuario) {
                return res.status(400).send({ message: 'Correo no registrado' });
            }

            // Asignamos la nueva contraseña 
            usuario.contrasenia = nuevaContrasenia;

            await usuario.save();

            return res.status(200).send({ message: 'Contraseña actualizada correctamente' });

        } catch (error) {
            console.error("ERROR RECUPERAR:", error);
            return res.status(500).send({ message: "Error al recuperar contraseña", error });
        }
    }
}

module.exports = controller