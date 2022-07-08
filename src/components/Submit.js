import React, { useState, useEffect } from "react";
import { storage, resumesCollection } from "../firebase.js";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { collection, addDoc, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import 'bootstrap/dist/css/bootstrap.min.css';
import JSONDATA from "../mock-data.json"



export const Submit = () => {
    const [items, setItems] = useState([]);
    const [imgUrl, setImgUrl] = useState(null);
    const [progresspercent, setProgresspercent] = useState(0);
    const [resumeArray, setResumeArray] = useState(JSONDATA)
    const [searchTerm, setSearchTerm] = useState("")


    

    const updateResumes = () => {
        getDocs(resumesCollection)
        .then((snapshot) => {
            let resumes = []
            snapshot.docs.forEach((doc)=> {
                resumes.push({...doc.data()})
            })
            setResumeArray(resumes)
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const file = e.target[0]?.files[0]


        if (!file) return;
        readExcel(file)
        const storageRef = ref(storage, `files/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on("state_changed",
            (snapshot) => {
                const progress =
                    Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setProgresspercent(progress);
            },
            (error) => {
                alert(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setImgUrl(downloadURL)
                });
            }
        );
    }

    const readExcel = (file) => {
        const promise = new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);

            fileReader.onload = (e) => {
                const bufferArray = e.target.result;

                const wb = XLSX.read(bufferArray, { type: "buffer" });

                const wsname = wb.SheetNames[0];

                const ws = wb.Sheets[wsname];

                const data = XLSX.utils.sheet_to_json(ws);

                resolve(data);
            };

            fileReader.onerror = (error) => {
                reject(error);
            };
        });

        promise.then((d) => {
            setItems(d);
            addDoc(resumesCollection, {
                Name: items[0].Name,
                Experience: items[0].Experience,
                Skills: items[0].Skills
            })
        });
    };





    return (
        <div class="container">
            <h1 class="text-center">Resume Parser</h1>
            <hr/>
            <form onSubmit={handleSubmit} className='form' class="row g-3 justify-content-center">
                <div class="col-auto">
                    <input class="form-control" type="file" required />
                </div>
                <div class="col-auto">
                    <button class="btn btn-primary" type='submit'>Upload</button>
                </div>
            </form>
            <br/>
            <div class="w-50 mx-auto">
                <input type="text" placeholder="Search..." class="form-control" onChange={event => {setSearchTerm(event.target.value)}}/>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Experience</th>
                        <th scope="col">Skills</th>
                    </tr>
                </thead>
                <tbody>
                    {resumeArray.filter((val)=>{
                        if(searchTerm.trim().length === 0) {
                            return val
                        } else if (val.Name.toLowerCase().includes(searchTerm.toLowerCase()) 
                          || val.Experience.toLowerCase().includes(searchTerm.toLowerCase()) 
                          || val.Skills.toLowerCase().includes(searchTerm.toLowerCase())) {
                            return val
                        }
                    }).map((d) => (
                        <tr key={d.Name}>
                            <th>{d.Name}</th>
                            <td>{d.Experience}</td>
                            <td>{d.Skills}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={updateResumes}>Update Resumes</button>
        </div>
    );
};