// Amit uncommentelni kell ha valamit csinálsz:
    // Ha a heroku-ra teszed fel, csak:
        // sor 9+16+20+21+22
    // Ha a localhost-ban használod, csak:
        // sor 10+16+20+21+22

const { Pool, Client } = require("pg")

// const connectionString = process.env.DATABASE_URL
const connectionString = 'postgres://pqcxblpsqrbgwv:09779da952dc12ffae91c7bc7d759430b4178f2c08cf08d0b79ffb297aa244dc@ec2-54-72-155-238.eu-west-1.compute.amazonaws.com:5432/d1g31djqo35igv'

// immediatly switch to psql: psql postgres://pqcxblpsqrbgwv:09779da952dc12ffae91c7bc7d759430b4178f2c08cf08d0b79ffb297aa244dc@ec2-54-72-155-238.eu-west-1.compute.amazonaws.com:5432/d1g31djqo35igv

module.exports = {
    dbPoolConnection: new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
        // database: "clipable-offline",
        // user: "offline_tester",
        // password: "offline_tester",
    })
}
