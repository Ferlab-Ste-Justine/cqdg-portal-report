import fs from 'fs';

import { IStudyInfos } from './getStudiesInfos';

const generateFiles = async (studyInfos: IStudyInfos[]): Promise<void[]> => {
    // Define the content of the README files
    // eslint-disable-next-line max-len
    const readmeEnContent = `Access.tsv document provides information about permitted data use purposes and conditions, mainly focused on research uses of data. "access_limitations" and "access_requirements" terms in the access.tsv file describe generic conditions for which datasets from each study you have selected for your research may be used. Please note that conditions may vary between studies or between some datasets within a study. We recommend that you review the conditions and ensure you are able to comply with these prior to requesting access to the data.\n\nStudy.tsv document provides a full list of all files you are requesting for each study. These files may be used in your access request. It is the requestor's responsibility to contact the Access authority and/or directly request access to data from these studies.`;
    // eslint-disable-next-line max-len
    const readmeFrContent = `Le document Access.tsv fournit des informations sur les finalités et les conditions d'utilisation des données autorisées, principalement axées sur les utilisations des données pour la recherche. Les termes "access_limitations" et" access_requirements" dans le fichier access.tsv décrivent les conditions génériques pour lesquelles les ensembles de données de chaque étude que vous avez sélectionnée pour votre recherche peuvent être utilisés. Veuillez noter que les conditions peuvent varier entre les études ou entre certains ensembles de données au sein d'une étude. Nous vous recommandons de revoir les conditions et de vous assurer que vous êtes en mesure de vous y conformer avant de demander l'accès aux données.\n\nLe document study.tsv fournit une liste complète de tous les fichiers que vous demandez pour chaque étude. Ces fichiers peuvent être utilisés dans votre demande d'accès. Il appartient au demandeur de contacter le responsable de l'accès et/ou de demander directement l'accès aux données de ces études.`;

    // Define the array of promises to create the files all together
    const createFilesSync = [
        fs.writeFileSync('/tmp/README_EN.txt', readmeEnContent),
        fs.writeFileSync('/tmp/README_FR.txt', readmeFrContent),
    ];

    // Define the content of the study TSV file, add file for each study found
    for (const studyInfo of studyInfos) {
        let studyTsvContent = `Study Name\tSubmitter Participant ID\tParticipant ID\tFile Name\tData Type\tFormat\n`;
        for (const file of studyInfo.files) {
            // eslint-disable-next-line max-len
            studyTsvContent += `${file.study_name}\t${file.submitter_participant_ids}\t${file.participant_ids}\t${file.file_name}\t${file.data_type}\t${file.file_format}\n`;
        }
        // Add to promises array
        createFilesSync.push(fs.writeFileSync(`/tmp/${studyInfo.study_code}.tsv`, studyTsvContent));
    }

    // Define the content of the access TSV file, add row in file for each study found
    let accessTsvContent = `Study Name\tAccess Limitations\tAccess Requirements\tAccess Authority\n`;
    for (const studyInfo of studyInfos) {
        accessTsvContent += `${studyInfo.study_name}\t${studyInfo.access_limitations}\t${studyInfo.access_requirements}\t${studyInfo.access_authority}\n`;
    }
    createFilesSync.push(fs.writeFileSync(`/tmp/access.tsv`, accessTsvContent));

    // Then execute to create the files
    return Promise.all(createFilesSync);
};

export default generateFiles;
