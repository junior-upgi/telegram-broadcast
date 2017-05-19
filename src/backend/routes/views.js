import express from 'express';

const router = express.Router();

router.get('/serviceStatus', (request, response) => {
    return response.status(200)
        .render('serviceStatus', { // render 'serviceStatus.hbs' view
            title: process.env.SYS_REF // test passing data to rendered template
        });
});

router.get('/regReq', (request, response) => {
    return response.status(200)
        .render('regReq', { // render 'serviceStatus.hbs' view
            title: process.env.SYS_REF // test passing data to rendered template
        });
});

module.exports = router;
