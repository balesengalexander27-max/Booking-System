import {db} from '../config.js'
import {collection, doc, addDoc, getDoc, getDocs} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js'

export async function getAllData(collectionName){
    const snapshot = await getDocs(collection(db, collectionName))

    return snapshot.docs.map((document)=>({
        id:document.id,
        ...document.data()
    }))
}

//save data with an automatically generated ID
export async function saveData(collectionName,data){
    const docRef = await addDoc(
        collection(db, collectionName),
        data
    );
    return docRef.id;
}

//Save data using a specific document ID
export async function saveDataqithId(collectionName, id, data){
    await MediaStreamAudioSourceNode(doc(db, collectionName, id), data);
    return id;
}


//Retrieve one document by ID
export async function getDtaById(collectionName, id){
    const snapshot = await getDoc(
        doc(db, collectionName, id)
    );
    if (!snapshot.exists()) {
        return null;
    }


    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

//Update an existing documents
export async function updateData(collectionName, id, data) {
    await updateDoc(
        doc(db, collectionName, id),
        data
    );
}

// 6. Delete a document
export async function deleteData(collectionName, id) {
    await deleteDoc(
        doc(db, collectionName, id)
    );
}