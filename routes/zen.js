var express = require('express');
var router = express.Router();

require('dotenv').config()

const { MongoClient, dbName } = require('../dbSchema');

dbUrl = process.env.MONGODB_URL
// console.log(process.env)
//get all students data

router.get('/get-students', async (req, res) => {
    const client = await MongoClient.connect(dbUrl);
    const db = await client.db('B30DB')

    try {
        let studentData = await db.collection('students').find({}).toArray();
        if (studentData.length > 0) {
            res.json({
                statusCode: 200,
                body: studentData
            })

        }
        else {
            res.json({
                statusCode: 404,
                message: "No Student List found"
            })
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            statusCode: 500,
            message: "Internal Error"
        })
    }

    finally {
        client.close();
    }
})

//get all mentors data

router.get('/get-mentors', async (req, res) => {
    const client = await MongoClient.connect(dbUrl);
    const db = await client.db('B30DB')

    try {
        let mentorData = await db.collection('mentors').find({}).toArray();
        if (mentorData.length > 0) {
            res.json({
                statusCode: 200,
                body: mentorData
            })

        }
        else {
            res.json({
                statusCode: 404,
                message: "No mentors found"
            })
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            statusCode: 500,
            message: "Internal Error"
        })
    }

    finally {
        client.close();
    }
})

//Mentor creation

router.post('/create-mentor', async (req, res) => {
    const client = await MongoClient.connect(dbUrl);
    const db = await client.db(dbName)

    try {
        let mentorData = await db.collection('mentors').find({ mentor_id: req.body.mentor_id }).toArray();
        if (mentorData.length > 0) {
            res.json({
                statusCode: 400,
                message: "Mentor Already exists"
            })
        }
        else {
            let newMentor = await db.collection('mentors').insertOne(req.body)
            res.json({
                statusCode: 201,
                message: "Mentor created",
                data: newMentor
            })
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            statusCode: 500,
            message: "Internal Error"
        })
    }

    finally {
        client.close();
    }

})

//Student creation

router.post('/create-student', async (req, res) => {
    const client = await MongoClient.connect(dbUrl);
    const db = await client.db(dbName);

    try {
        let studentData = await db.collection('students').find({ student_id: req.body.student_id }).toArray();
        if (studentData.length > 0) {
            res.json({
                statusCode: 400,
                message: "Student Already exists"
            })
        }
        else {
            let newStudent = await db.collection('students').insertOne(req.body)
            res.json({
                statusCode: 201,
                message: "Student created",
                data: newStudent
            })
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            statusCode: 500,
            message: "Internal Error"
        })
    }

    finally {
        client.close();
    }

})

//Assign student to Mentor 

router.post('/assign-student', async (req, res) => {
    const client = await MongoClient.connect(dbUrl);
    const db = await client.db('B30DB');

    try {
        let mentorData = await db.collection('mentors').find({ mentor_id: req.body.mentor_id }).toArray();
        let studentData = await db.collection('students').find({ student_id: req.body.student_id }).toArray();
        //   let users = await db.collection('users').find({email:req.body.email},{userid:1,email:1}).toArray();
        if (mentorData.length > 0 && studentData.length > 0) {

            if (studentData[0].mentor_assigned == '') {
                const studentsAssigned = mentorData[0].students_assigned;
                const assignedStus = [...studentsAssigned, req.body.student_id];
                // console.log(assignedStus);
                await db.collection('mentors').updateOne({ mentor_id: req.body.mentor_id }, { $set: { students_assigned: [...assignedStus] } })
                await db.collection('students').updateOne({ student_id: req.body.student_id }, { $set: { mentor_assigned: req.body.mentor_id } })

                res.json({
                    statusCode: 200,
                    message: "Student assigned to mentor successfully"
                    // data:users
                })
            }
            else {
                res.json({
                    statusCode: 400,
                    message: "Student already assigned to a mentor"
                })
            }
        }
        else {
            res.json({
                statusCode: 404,
                message: "No mentor/Student found"
            })
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            statusCode: 500,
            message: "Internal Error"
        })
    }

    finally {
        client.close();
    }

    // res.send('respond with a resource');
})

//Assign Mentor to student

router.post('/assign-mentor', async (req, res) => {
    const client = await MongoClient.connect(dbUrl);
    const db = await client.db('B30DB');
    //remove the student record from old mentor and then update to new mentor student list as well
    try {
        let mentorData = await db.collection('mentors').find({ mentor_id: req.body.mentor_id }).toArray();
        let studentData = await db.collection('students').find({ student_id: req.body.student_id }).toArray();
        if (mentorData.length > 0 && studentData.length > 0) {
            const oldMentor_id = studentData[0].mentor_assigned;
            if(oldMentor_id !='')
            {
            let old_mentorData = await db.collection('mentors').find({ mentor_id: oldMentor_id }).toArray();
            const oldmentor_studentsAssigned = old_mentorData[0].students_assigned;
            oldmentor_studentsAssigned.splice((oldmentor_studentsAssigned.indexOf(req.body.student_id)),1);
            await db.collection('mentors').updateOne({ mentor_id: oldMentor_id }, { $set: { students_assigned: [...oldmentor_studentsAssigned] } })
            }

           // update the new mentor for student
            await db.collection('students').updateOne({ student_id: req.body.student_id }, { $set: { mentor_assigned: req.body.mentor_id } })
            
            //update new mentor's student list
            const studentsAssigned = mentorData[0].students_assigned;
            const assignedStus = [...studentsAssigned, req.body.student_id];
           await db.collection('mentors').updateOne({ mentor_id: req.body.mentor_id }, { $set: { students_assigned: [...assignedStus] } })
            res.json({
                statusCode: 200,
                message: "Mentor changed to student successfully"
            })
        }

        else {
            res.json({
                statusCode: 404,
                message: "No mentor/Student found"
            })
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            statusCode: 500,
            message: "Internal Error"
        })
    }
    finally {
        client.close();
    }
})

// Show all students for a perticluar mentor

router.get('/get-students/:id', async (req, res) => {
    const client = await MongoClient.connect(dbUrl);
    const db = await client.db('B30DB')

    try {
        let mentorData = await db.collection('mentors').find({ mentor_id: req.params.id }).toArray();
        if (mentorData.length > 0) {
            let studentsAssigned = mentorData[0].students_assigned;
            let studentList = await db.collection('students').find({ student_id: { $in: [...studentsAssigned] } }, { student_id: 1, student_name: 1, student_email: 1 }).toArray();
            const student_List = studentList.map(({ student_id, student_name, student_email, student_batch }) => {
                const stuData = { student_id, student_name, student_email, student_batch }
                return stuData
            })
            res.json({
                statusCode: 200,
                body: student_List
            })

        }
        else {
            res.json({
                statusCode: 404,
                message: "Mentor not found"
            })
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            statusCode: 500,
            message: "Internal Error"
        })
    }

    finally {
        client.close();
    }
})

module.exports = router;
