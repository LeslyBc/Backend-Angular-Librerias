'use strict'

var Prestamos = require('../models/prestamos');
var path = require('path');

var controller = {

    testPrestamo: function (req, res) {
        return res.status(200).send(
            '<h1>Hola, funciona esta Api para prestamos </h1>'
        )
    },

    listaPrestamos: function (req, res) {
        Prestamos.find().populate('usuario_id').populate('libros_id').sort().exec()
            .then(prestamo => {
                if (!prestamo || prestamo.length === 0)
                    return res.status(404).send({ message: 'Nadie tiene prestamos' });
                return res.status(200).send({ prestamo });
            })
            .catch(err => {
                return res.status(500).send({ message: 'Error al obtener los datos', error: err });
            })
    },

    verPrestamosPorUsuario: async (req, res) => {
        const usuarioId = req.params.id;

        try {
            const prestamos = await Prestamos.find({ usuario_id: usuarioId })
                .populate('libros_id')
                .exec();

            if (!prestamos || prestamos.length === 0) {
                return res.status(200).send({ prestamo: [], message: 'No se encontraron préstamos para este usuario' });
            }
            return res.status(200).send({ prestamo: prestamos });

        } catch (err) {
            console.error(err);
            return res.status(500).send({ message: 'Error al obtener los préstamos del usuario', error: err });
        }
    },

    verPrestamo: function (req, res) {
        var prestamoId = req.params.id;

        Prestamos.findById(prestamoId).populate('usuario_id').populate('libros_id')
            .then(prestamo => {
                if (!prestamo) return res.status(400).send({ message: 'No se encontró el prestamo específico' });
                return res.status(200).send(prestamo);

            })

            .catch(err => {
                if (err.name === 'CastError') {
                    return res.status(404).send({ message: 'El ID es incorrecto o no es válido' });
                }
                return res.status(500).send({ message: 'Error al recuperar los datos', error: err });
            });
    },

    guardarPrestamo: function (req, res) {
        var prestamo = new Prestamos();
        var params = req.body;

        if (!params.usuario_id || !params.libros_id || !params.horasPrestamo) {
            return res.status(400).send({ message: 'Faltan campos obligatorios para el préstamo' });
        }

        prestamo.usuario_id = params.usuario_id;
        prestamo.libros_id = params.libros_id;
        prestamo.descripcion = params.descripcion || "Solicitud de préstamo de usuario";
        prestamo.horasPrestamo = params.horasPrestamo
        prestamo.multa = params.multa;

        prestamo.save()
            .then(prestamoGuardado => {
                if (!prestamoGuardado)
                    return res.status(400).send({ message: 'No se pudo guardar el préstamo' });

                return Prestamos.findById(prestamoGuardado._id)
                    .populate('usuario_id')
                    .populate('libros_id')
                    .then(prestamoCompleto => {
                        return res.status(200).send({ prestamo: prestamoCompleto });
                    });
            })
            .catch(err => {
                return res.status(500).send({ message: 'No se pudieron obtener los datos', error: err });
            });
    },

    actualizarPrestamo: function (req, res) {
        var prestamoId = req.params.id
        var actualizar = req.body

        Prestamos.findByIdAndUpdate(prestamoId, actualizar, { new: true }).populate('usuario_id').populate('libros_id')
            .then(prestamoActualizado => {
                if (!prestamoActualizado)
                    return res.status(400).send({ message: 'No se puede actualizar el libro, no se encuentra' });
                return res.status(200).send({ prestamo: prestamoActualizado });
            })
            .catch(err => {
                if (err.name === 'CastError') {
                    return res.status(404).send({ message: 'ID inválido o escrito incorrectamente' })
                }
                return res.status(500).send({ message: 'error al obtener los datos', error: err });
            });
    },

    borrarPrestamo: function (req, res) {
        var prestamoId = req.params.id

        Prestamos.findByIdAndDelete(prestamoId).populate('usuario_id').populate('libros_id')
            .then(prestamoBorrado => {
                if (!prestamoBorrado)
                    return res.status(400).send({ message: 'El prestamo no fue encontrado para borrar' });
                return res.status(200).send({ prestamo: prestamoBorrado, message: 'Prestamo eliminado con éxito' });
            })

            .catch(err => {
                if (err.name === 'CastError') {
                    return res.status(404).send({ message: 'El ID no es válido o está incorrecto' });
                }
                return res.status(500).send({ message: 'Error al recuperar datos', error: err });
            });


    }
}

module.exports = controller;
