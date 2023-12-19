const express = require('express')
const app = express()
const port = 5555;
const cors = require('cors');
const { exec } = require("child_process");

const bodyParser = require('body-parser')

app.use(cors({
    origin: '*'
}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Service running'
    })
})


app.post('/start-terminal', (req, res) => {
    console.log(req.body);
    exec(`gnome-terminal --command="${req.body.command}"`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return res.status(500).json({
                message: 'Quelque chose s\'est mal passé'
            })
        }
        return res.status(500).json({
            message: 'Terminal lancé'
        })
    });
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})