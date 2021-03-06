const express = require("express")
const path = require("path")
const fs = require("fs")
const multer = require('multer')
// const { LocalStorage } = require("node-localstorage")
const { Pool, Client } = require("pg")

const router = express.Router()
const db = require("../client").dbPoolConnection

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.split("/")[0] == "video")
            cb(null, './uploads/videos')
        else
            cb(null, './uploads/images')
    },
    filename: (req, file, cb) => {
        db.query("SELECT uuid_generate_v4()", (err, result) => {
            if (err)
                console.log(err)

            // cb(null, Date.now() + "--" + file.originalname)
            cb(null, result.rows[0].uuid_generate_v4 + "." + file.originalname.slice(1+file.originalname.lastIndexOf(".")))
            // cb(null, result.rows[0].uuid_generate_v4)
        })
    }
})
const upload = multer({ storage: fileStorageEngine })

const displayNotFound = res => {
    res.sendFile(path.join(__dirname, "../views/not_found.html"))
}
const sqls = {
    getAuthUser: fs.readFileSync("./sql/getAuthUser.sql").toString()
}


router.get("/post/:id", (req, res) => {
    db.query("SELECT videos.id as video_id,title,description,mimetype,uploadtype,auth_users.id as user_id,username,email FROM videos JOIN auth_users ON videos.user_id = auth_users.id WHERE videos.id = $1;", [req.params.id], (err, result) => {
        if (err) {
            console.log(err)
            return res.redirect("/")
        }
        if (result.rowCount !== 1)
            return displayNotFound(res)

        res.render("post", {
            csrfToken: req.csrfToken,
            video: result.rows[0]
        })
    })
})

// router.get("/create", authorize(["customer.create", "customer:default"]), (req, res) => {
    router.get("/create", (req, res) => {
    res.render("upload", {
        csrfToken: req.csrfToken
    })
})

// router.post("/upload", authorize(["customer:create", "customer:default"]), upload.single("video"), (req, res) => {
router.post("/upload", upload.single("video"), (req, res) => {
    if (!req.file) {
        console.log("Error: Not get file from multer")
        return displayNotFound(res)
    }
    if (!req.body.title || typeof req.body.title !== "string" || typeof req.body.description !== "string") {
        console.log("Something is missing or wrong data type.")
        return displayNotFound(res)
    }

    const fileName = req.file.filename
    const file_uuid = fileName.slice(0, fileName.lastIndexOf("."))
    // db.query(sqls.getAuthUser, [LocalStorage.device_uuid], (err2, selfAuthUser) => {
    db.query(sqls.getAuthUser, [req.session.device_uuid], (err2, selfAuthUser) => {
        if (err2) console.log(err2)
        if (selfAuthUser.rowCount !== 1) return console.log("User is not loggedIn")
        db.query("INSERT INTO videos (id, mimetype, title, description, user_id) VALUES ($1, $2, $3, $4, $5);", [file_uuid, fileName.slice(fileName.lastIndexOf(".")+1), req.body.title, req.body.description?req.body.description:null, selfAuthUser.rows[0].user_id], (err) => {
            if (err) {
                console.log(err.message)
                res.status(500).json({ msg: err.message })
            } else {
                res.status(200).send("Successfully completed!")
            }
    
            db.query("INSERT INTO uploads(upload_id, uploaded) VALUES ($1, $2)", [file_uuid, fs.readFileSync(`./uploads/videos/${fileName}`)], (err) => {
                if (err)
                    console.log(err.message)
            })
        })
    })
})

router.use("/", express.static(path.join(__dirname, "../uploads"))) // later: check if exists from sql download it; else not_found

router.get("/sql/videos/:video_id", (req, res) => {
    if (!req.params.video_id)
        return displayNotFound(res)

    const video_id = req.params.video_id
    db.query("SELECT uploaded FROM uploads WHERE upload_id = $1", [video_id.slice(0, video_id.lastIndexOf("."))], (err, result) => {
        if (err) {
            console.log(err.message)
            return displayNotFound(res)
        }
        if (result.rowCount == 0)
            return displayNotFound(res)

        res.writeHead(200, {'Content-Type': 'video/mp4'});
        res.end(result.rows[0].video)  
    })
})


module.exports = {
    router
}