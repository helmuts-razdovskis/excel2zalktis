const fs = require('fs');
const path = require('path');
const readline = require('readline');
const XLSX = require('xlsx');
const xmlbuilder = require('xmlbuilder');
const xmlgen = require('./xmlgen');
const xmlprofiles = require('./xmlprofiles');
const xlsmappings = require('./xlsmappings');
const program = require('commander');

try {
    // Get the current working directory.
    const cwd = process.cwd();
    // Specify the directory you want to read
    const configDir = path.join(cwd, '/config/');
    const xlsmappingsjson = path.join(configDir, 'xlsmappings.json');
    const xmlprofilesjson = path.join(configDir, 'xmlprofiles.json');

    program
        .name('excel2zalktis')
        .description('Converts XLSX files to Zalktis XML files')
        .version('0.1.0')
        .option('-d, --dump', 'Dump the config')
        .option('-m, --mapping <mapping>', 'Process only the specified mapping')
        .option('-s, --skip-checks', 'Skip data validations')
        .option('-l, --list-profiles', 'List available profiles');

    program.parse();

    const options = program.opts();

    // --dump
    if (options.dump) {

        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir);
        }

        fs.writeFileSync(xlsmappingsjson, JSON.stringify(xlsmappings, null, 4));

        fs.writeFileSync(xmlprofilesjson, JSON.stringify(xmlprofiles, null, 4));

        process.exit(0);
    }

    let profiles = xmlprofiles;
    if (fs.existsSync(xmlprofilesjson)) {
        profiles = JSON.parse(fs.readFileSync(xmlprofilesjson));
    }

    // --list-profiles
    if (options.listProfiles) {
        Object.keys(profiles).forEach(profile => {
            console.log(profile);
        });
        process.exit(0);
    }

    let mappings = xlsmappings;
    if (fs.existsSync(xlsmappingsjson)) {
        mappings = JSON.parse(fs.readFileSync(xlsmappingsjson));
    }

    // --mapping
    if (options.mapping) {
        mappings = mappings.filter(mapping => mapping === options.mapping);
        if (mappings.length === 0) {
            throw new Error(`Mapping profile '${options.mapping}' not found!`);
        }
    }

    Object.keys(mappings).forEach(mapkey => {

        const mapdir = path.join(cwd, 'files', mapkey);
        if (!fs.existsSync(mapdir)) {
            console.error(`Directory ${mapdir} not found!`);
            return;
        }

        const mapping = mappings[mapkey];
        const xlsxFiles = listXlsxFiles(mapdir);

        xlsxFiles.forEach(xlfile => {

            const xlsFileName = path.join(mapdir, xlfile);
            // Read the workbook
            const jsonData = loadAndGroupFile(xlsFileName, mapping);

            // Create the root of your xml document
            const xmlRoot = xmlbuilder.create('Root', { encoding: 'utf-8' });

            const config = { mapping, skipChecks: options.skipChecks };

            xmlgen.xmlFailaPase(jsonData, xmlRoot, config);

            // Map the JSON data to xml
            jsonData.forEach((row, rowIndex) => {
                if (rowIndex > 0) {
                    const profile = getProfile(row, mapping, profiles, xlsFileName);

                    xmlgen.xmlDokuments(row, xmlRoot, { ...config, ...{ profile }, xlsFileName });
                }
            });

            // Convert the xml to string
            const xmlString = xmlRoot.end({ pretty: true });

            // Write XML to file
            const xmlFileName = ChangeFileExt(xlsFileName, '.xml');
            fs.writeFileSync(xmlFileName, xmlString);
        });
    });
} catch (err) {
    console.error(err);

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    console.log('Press any key to continue...');
    process.stdin.on('keypress', (str, key) => {
        process.stdin.setRawMode(false);
        process.stdin.end();
        process.exit(1);
    });
}


function loadAndGroupFile(filePath, mapping) {
    const workbook = XLSX.readFile(filePath);

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

    const groupBy = mapping['HronoDocNr'];

    // group data by HronoDocNr and take the first rows of each group
    const groupedData = jsonData.reduce((acc, row) => {
        const key = row[groupBy];
        if (!acc[key]) {
            acc[key] = row;
        }
        return acc;
    }, {});

    // convert grouped data back to array
    const groupedArray = Object.keys(groupedData).map(key => groupedData[key]);

    return groupedArray;
}

function ChangeFileExt(filePath, newExtension) {
    return path.format({
        dir: path.dirname(filePath),
        name: path.basename(filePath, path.extname(filePath)),
        ext: newExtension,
    });
}
function getProfile(data, mapping, profiles, xlsFileName) {

    const col = mapping['_profile'];

    const profile = profiles[data[col]];
    if (!profile) {
        throw new Error(`Profile '${data[col]}' not found! File: ${xlsFileName}`);
    }

    return profile;
}

function getMappingsList() {
    // return keys of mappings object
    return Object.keys(mappings);
}

function listXlsxFiles(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);
        return files.filter(file => path.extname(file).toLowerCase() === '.xlsx');
    } catch (err) {
        console.error('An error occurred while reading the directory:', err);
    }
}

