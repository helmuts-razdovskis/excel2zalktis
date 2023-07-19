const getValue = (key, data, config) => {

    if (config.profile)
        if (config.profile[key]) {
            return config.profile[key];
        }

    const col = config.mapping[key];
    return data[col];
}


const xmlDokuments = (data, xmlRoot, config) => {
    // <HronoID>-1</HronoID>
    // <HronoKontets>1</HronoKontets>
    // <HronoTips>8</HronoTips>
    // <HronoDatums>2023-07-15T15:00:00</HronoDatums>
    // <HronoDocName>Rēķins</HronoDocName>
    // <HronoDocNr/>
    // <ValutasKods>EUR</ValutasKods>
    // <Pamatojums />
    // <DateTerm>1900-01-01T15:00:00</DateTerm>
    // <Fadr />
    // <Kadr />
    // <GadaID>3</GadaID>
    // <Rezerve1 />
    // <Rezerve2>ar pārskaitījumu</Rezerve2>
    // <Rezerve3>0</Rezerve3>
    // <SagDatums>2023-07-15T15:00:00</SagDatums>
    // <ProjektsKods />
    // <PersonalName>Fiziska persona LV</PersonalName>
    // <PersonalVards />
    // <PersonalNmrNr >000000-00000</PersonalNmrNr>
    // <PersonalPvnNr />
    // <PersonalAdresscity>220.lv</PersonalAdresscity>
    // <PersonalAdressstreet />
    // <PersonalPastaindekss />
    // <PersonalValstsID>428</PersonalValstsID>
    // <PersonalTips>1</PersonalTips>
    // <PersonalKonts1 />

    const doc = xmlRoot
        .ele('Dokuments')
        .ele('HronoID', -1).up()
        .ele('HronoKontets', 1).up()
        .ele('HronoTips', 8).up()
        .ele('HronoDatums', getValue('HronoDatums', data, config) + 'T00:00:00').up()
        .ele('HronoDocName', 'Rēķins').up()
        .ele('HronoDocNr', getValue('HronoDocNr', data, config)).up()
        .ele('ValutasKods', 'EUR').up()
        .ele('Pamatojums').up()
        .ele('DateTerm', '1900-01-01T15:00:00').up()
        .ele('Fadr').up()
        .ele('Kadr').up()
        .ele('GadaID', -1).up()
        .ele('Rezerve1').up()
        .ele('Rezerve2', 'ar pārskaitījumu').up()
        .ele('Rezerve3', 0).up()
        .ele('SagDatums', getValue('HronoDatums', data, config) + 'T00:00:00').up()
        .ele('ProjektsKods').up()
        .ele('PersonalName', getValue('PersonalName', data, config)).up()
        .ele('PersonalVards').up()
        .ele('PersonalNmrNr', getValue('PersonalNmrNr', data, config)).up()
        .ele('PersonalPvnNr', getValue('PersonalPvnNr', data, config)).up()
        .ele('PersonalAdresscity').up()
        .ele('PersonalAdressstreet').up()
        .ele('PersonalPastaindekss').up()
        .ele('PersonalValstsID', getValue('PersonalValstsID', data, config)).up()
        .ele('PersonalTips', getValue('PersonalTips', data, config)).up()
        .ele('PersonalKonts1').up()

    xmlKontejums(data, doc, config);
    xmlKontejumsPvn(data, doc, config);
    xmlPZRekviziti(data, doc, config);
}
const xmlKontejums = (data, xmlRoot, config) => {

    //  <Kontejums>
    //     <DKonts>2670</DKonts>
    //     <DNosaukums>Pārējie naudas līdzekļi</DNosaukums>
    //     <DTips>0</DTips>
    //     <DDaudzums>1.00</DDaudzums>
    //     <DValuta>EUR</DValuta>
    //     <KKonts>6110</KKonts>
    //     <KNosaukums>Ieņēmumi no pamatdarbības produkcijas un pakalpojumu pārdošanas</KNosaukums>
    //     <KTips>0</KTips>
    //     <KDaudzums>1.00</KDaudzums>
    //     <KValuta>EUR</KValuta>
    //     <PreceID>0</PreceID>
    //     <SummaBIL>5.00</SummaBIL>
    //     <Summa>5.00</Summa>
    //     <Text>bcd</Text>
    //     <Tips>1</Tips>
    //     <Rezerve1>0</Rezerve1>
    //     <Rezerve2>gab.</Rezerve2>
    //     <Rezerve3>a</Rezerve3>
    //     <Cena>5.00</Cena>
    //     <PVN>21</PVN>
    //     <Partija>.</Partija>
    //     <AkcizeMarka />
    // </Kontejums>

    const config2 = { ...config, ...{ profile: config.profile['Kontejums'] } };
    const summaBezPVN = toSumma(getValue('SummaBezPVN', data, config));

    if (!(config.skipChecks)) {
        const summaPvn = toSummaAbs(getValue('SummaPVN', data, config));
        if (isNaN(summaPvn))
            throw new Error('SummaPVN is NaN');
        if (isNaN(summaBezPVN))
            throw new Error('SummaBezPVN is NaN');
        if (summaPvn != 0 && summaPvn >= Math.abs(summaBezPVN))
            throw new Error('SummaPVN >= SummaBezPVN');
    }

    const daudzums = 1 * Math.sign(summaBezPVN);

    xmlRoot
        .ele('Kontejums')
        .ele('DKonts', getValue('DKonts', data, config2)).up()
        .ele('DNosaukums').up()
        .ele('DTips', 0).up()
        .ele('DDaudzums', daudzums).up()
        .ele('DValuta', 'EUR').up()
        .ele('KKonts', getValue('KKonts', data, config2)).up()
        .ele('KNosaukums').up()
        .ele('KTips', 0).up()
        .ele('KDaudzums', daudzums).up()
        .ele('KValuta', 'EUR').up()
        .ele('PreceID', 0).up()
        .ele('SummaBIL', summaBezPVN).up()
        .ele('Summa', summaBezPVN).up()
        .ele('Text', 'Rēķins par precēm').up()
        .ele('Tips', 1).up()
        .ele('Rezerve1', 0).up()
        .ele('Rezerve2').up()
        .ele('Rezerve3').up()
        .ele('Cena', Math.abs(summaBezPVN)).up()
        .ele('PVN', getValue('LikmePVN', data, config2)).up()
        .ele('Partija', '.').up()
        .ele('AkcizeMarka').up()
}

const toSumma = (value) => {
    return parseFloat(value);
}

const toSummaAbs = (value) => {
    return Math.abs(parseFloat(value));
}

const xmlKontejumsPvn = (data, xmlRoot, config) => {

    // <Kontejums>
    //     <DKonts>5720</DKonts>
    //     <DNosaukums>Norēķini par citiem nodokļiem, nodevām un maksājumiem budžetam</DNosaukums>
    //     <DTips>0</DTips>
    //     <DDaudzums>0.00</DDaudzums>
    //     <DValuta>EUR</DValuta>
    //     <KKonts>5720</KKonts>
    //     <KNosaukums>Norēķini par citiem nodokļiem, nodevām un maksājumiem budžetam</KNosaukums>
    //     <KTips>0</KTips>
    //     <KDaudzums>0.00</KDaudzums>
    //     <KValuta>EUR</KValuta>
    //     <PreceID>0</PreceID>
    //     <SummaBIL>1.05</SummaBIL>
    //     <Summa>1.05</Summa>
    //     <Text>21</Text>
    //     <Tips>3</Tips>
    //     <Rezerve1 />
    //     <Rezerve2 />
    //     <Rezerve3 />
    //     <Cena>0.00</Cena>
    //     <PVN>21</PVN>
    //     <Partija>.</Partija>
    //     <AkcizeMarka />
    // </Kontejums>

    if (!config.profile['KontejumsPvn']) return;

    const config2 = { ...config, ...{ profile: config.profile['KontejumsPvn'] } };

    xmlRoot
        .ele('Kontejums')
        .ele('DKonts', getValue('DKonts', data, config2)).up()
        .ele('DNosaukums').up()
        .ele('DTips', 0).up()
        .ele('DDaudzums', 0.00).up()
        .ele('DValuta', 'EUR').up()
        .ele('KKonts', getValue('KKonts', data, config2)).up()
        .ele('KNosaukums').up()
        .ele('KTips', 0).up()
        .ele('KDaudzums', 0.00).up()
        .ele('KValuta', 'EUR').up()
        .ele('PreceID', 0).up()
        .ele('SummaBIL', getValue('SummaPVN', data, config)).up()
        .ele('Summa', getValue('SummaPVN', data, config)).up()
        .ele('Text', getValue('LikmePVN', data, config2)).up() // PVN likme
        .ele('Tips', 3).up()
        .ele('Rezerve1').up()
        .ele('Rezerve2').up()
        .ele('Rezerve3').up()
        .ele('Cena', 0.00).up()
        .ele('PVN', getValue('LikmePVN', data, config2)).up()
        .ele('Partija', '.').up()
        .ele('AkcizeMarka').up()
}

const xmlFailaPase = (values, xmlRoot, config) => {

    const todayAsUtc = new Date().toISOString().slice(0, 10);

    xmlRoot
        .ele('FailaPase')
        .ele('Pamats', 'Zalktis').up()
        .ele('DatuAvots', 'custom').up()
        .ele('Versija', 435).up()
        .ele('xmlversion', 'v2').up()
        .ele('AtlasesGatavosanasLaiks', todayAsUtc).up()
        // .ele('AtlaseDatumsNo').up()
        // .ele('AtlaseDatumsLidz').up()
        .ele('AtlaseDokTips', '-1').up();
}

const xmlPZRekviziti = (values, xmlRoot, config) => {
    // <PZrekviziti>
    // <TransportsPersonalID>-1</TransportsPersonalID>
    // <Automarka />
    // <Soferis />
    // <Darijumaapraksts>Preču piegāde</Darijumaapraksts>
    // <DRN />
    // <Iepakojums />
    // <ProjektsID />
    // <AgentsID>-1</AgentsID>
    // </PZrekviziti>         

    xmlRoot
        .ele('PZrekviziti')
        .ele('TransportsPersonalID', -1).up()
        .ele('Automarka').up()
        .ele('Soferis').up()
        .ele('Darijumaapraksts', 'Preču piegāde').up()
        .ele('DRN').up()
        .ele('Iepakojums').up()
        .ele('ProjektsID').up()
        .ele('AgentsID', -1).up()
}

module.exports = {
    xmlFailaPase,
    xmlDokuments
}
