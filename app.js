const fs = require('fs');
const flags = require('flags');

// Parse CLI
flags.defineString('path', null, 'Path to the asset directory');
flags.defineString('bucket', null, 'Bucket');
flags.defineString('keyfile', null, 'Google Key File');
flags.defineString('project', null, 'Google Project ID');
flags.parse();

if (!flags.get('project') || !flags.get('bucket') || !flags.get('keyfile') || !flags.get('project')) {
    throw new Error("Please fill all the parameters");
}

const gcs = require('@google-cloud/storage')({
    projectId: flags.get('project'),
    keyFilename: flags.get('keyfile')
});

const walk = (origin, p="") => {
    return fs.readdirSync(`${origin}/${p}`).map(f => {
        let newP = `${p}/${f}`;
        let newPath = `${origin}/${newP}`;
        if (fs.statSync(`${origin}/${newP}`).isDirectory()) {
            return walk(origin, newP);
        }
        return [{
            key: newP.substr(1),
            path: `${origin}${newP}`
        }];
    }).reduce((a, b) => a.concat(b), []);
};

const bucket = gcs.bucket('lx-test');

Promise.all(walk(flags.get('path')).map(d => {
    return bucket.file(d.key).save(fs.readFileSync(d.path, 'utf-8'));
}))
.then(console.log)
.catch(console.error);