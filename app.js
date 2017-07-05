const fs = require('fs');
const flags = require('flags');

// Parse CLI
flags.defineString('path', null, 'Path to the asset directory');
flags.defineString('bucket', null, 'Bucket');
flags.defineString('keyfile', null, 'Google Key File');
flags.defineString('project', null, 'Google Project ID');
flags.defineString('subdir', null, 'Subdirectory to load files to');
flags.parse();

if (!flags.get('project') || !flags.get('bucket') || !flags.get('keyfile') || !flags.get('project')) {
    throw new Error("Please fill all the parameters");
}

const walk = (origin, subdir, p="") => {
    return fs.readdirSync(`${origin}/${p}`).map(f => {
        let newP = `${p}/${f}`;
        let newPath = `${origin}/${newP}`;
        if (fs.statSync(newPath).isDirectory()) {
            return walk(origin, subdir, newP);
        }
        return [{
            key: `${subdir ? subdir + "/" : ""}${newP.substr(1)}`,
            path: `${origin}${newP}`
        }];
    }).reduce((a, b) => a.concat(b), []);
};

const gcs = require('@google-cloud/storage')({
    projectId: flags.get('project'),
    keyFilename: flags.get('keyfile')
});

const bucket = gcs.bucket(flags.get('bucket'));

Promise.all(walk(flags.get('path'), flags.get('subdir')).map(d => {
    // console.log(d);
    return new Promise((res, rej) => {
        fs.createReadStream(d.path)
        .pipe(bucket.file(d.key).createWriteStream())
        .on('error', rej)
        .on('finish', res);
    });
}))
.catch(console.error);