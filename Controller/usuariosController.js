'use strict'

var Usuarios = require('../models/usuarios');
var path = require('path');
var fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var controller = {

    home: (req, res) => res.status(200).send("<h1>Home Empleado</h1>"),

    verUsuarios: function (req, res) {
        Usuarios.find({}).sort().exec()
            .then(usuario => {
                if (!usuario || usuario.length === 0)
                    return res.status(404).send({ message: 'No se encontaron usuarios' })
                const usuariosSinContrasenia = usuario.map(u => {
                    u.contrasenia = undefined; 
                    return u;
                });
                return res.status(200).send({ usuario: usuariosSinContrasenia })
            })
            .catch(err => {
                return res.status(500).send({ message: 'Error al obtener datos', error: err });
            });
    },


    // Función para obtener datos del perfil
    verUsuario: function (req, res) {
        var usuarioId = req.params.id;

        Usuarios.findById(usuarioId).select('-contrasenia') // <-- CRÍTICO: Excluir contrasenia
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
        usuario.correo = params.correo ? params.correo.trim().toLowerCase() : null;

        // Asignamos el valor de la contraseña
        if (params.contrasenia) {
            usuario.contrasenia = params.contrasenia.trim();
        } else {
             return res.status(400).send({ message: 'La contraseña es obligatoria' });
        }
        
        usuario.imagen = null;

        usuario.save()
            .then(usuarioGuardado => {
                if (!usuarioGuardado) return res.status(404).send({ message: 'No se ha guardado el usuario' })
                // Ocultar contraseña
                usuarioGuardado.contrasenia = undefined;
                return res.status(200).send({ usuario: usuarioGuardado });
            })
            .catch(err => {
                return res.status(500).send({ message: 'Error al guardar', error: err });
            });
    },

    actualizarUsuario: function (req, res) {
        var usuariosId = req.params.id
        var actualizar = req.body;

        Usuarios.findByIdAndUpdate(usuariosId, actualizar, { new: true })
            .then(usuarioActualizado => {
                if (!usuarioActualizado) return res.status(404).send({ message: 'El usuario no existe, no se podrá actualizar' })
                usuarioActualizado.contrasenia = undefined; // Ocultar contraseña
                return res.status(200).send({ usuario: usuarioActualizado });
            })
            .catch(err => {
                if (err.name === 'CastError') {
                    return res.status(404).send({ message: 'El ID no es válido o está incorrecto' });
                }
                return res.status(500).send({ message: 'Error al recuperar datos', error: err });
            });
    },

    // Función de lógica para actualizar nombre, apellido y correo
    actualizarDatos: async function (req, res) {
        const usuarioId = req.params.id;
        const { nombre, apellido, correo } = req.body; 
        
        try {
            let usuario = await Usuarios.findById(usuarioId);
            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            
            //cambios solo en los campos permitidos
            if (nombre) usuario.nombre = nombre;
            if (apellido) usuario.apellido = apellido;
            if (correo) usuario.correo = correo;

            const usuarioActualizado = await usuario.save(); 
            usuarioActualizado.contrasenia = undefined; // Limpiar la respuesta

            return res.status(200).send({ 
                message: 'Datos actualizados correctamente',
                usuario: usuarioActualizado
            });
            
        } catch (error) {
            console.error("ERROR ACTUALIZAR DATOS:", error);
            return res.status(500).send({ message: 'Error al actualizar los datos', error });
        }
    },

    // Función para cambiar la contraseña 
    cambiarContrasena: async function (req, res) {
        const usuarioId = req.params.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).send({ message: 'Faltan la contraseña actual o la nueva contraseña.' });
        }

        try {
            const usuario = await Usuarios.findById(usuarioId);
            if (!usuario) {
                return res.status(404).send({ message: 'Usuario no encontrado' });
            }
            
            //Verificar la contraseña actual
            const isMatch = await bcrypt.compare(currentPassword, usuario.contrasenia);
            if (!isMatch) {
                return res.status(400).send({ message: 'La contraseña actual es incorrecta' });
            }

            //Aplicar la nueva contraseña
            usuario.contrasenia = newPassword; 
            
            await usuario.save(); 

            return res.status(200).send({ message: 'Contraseña actualizada correctamente' });
            
        } catch (error) {
            console.error("ERROR CAMBIAR CONTRASEÑA:", error);
            return res.status(500).send({ message: 'Error al cambiar la contraseña', error });
        }
    },

    deleteUsuarios: function (req, res) {
        var usuarioId = req.params.id;
        Usuarios.findByIdAndDelete(usuarioId)
            .then(usuarioEliminado => {
                if (!usuarioEliminado) return res.status(400).send({ message: 'no se puede eliminar un usuario que no existe' });
                return res.status(200).send({ usuario: usuarioEliminado, message: 'Usuario eliminado con satisfacción' })
            })
            .catch(err => {
                if (err.name === 'CastError') {
                    return res.status(404).send({ message: 'El Id no es válido' })
                }
                return res.status(500).send({ message: 'Error al recuperar datos', error: err });
            });
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

            usuario.contrasenia = undefined; 

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