import thinky from '../thinky';

const type = thinky.type;

let Position = thinky.createModel('Positions', {
  id: type.string(),
  type: type.string().enum([
    "candidate",
    "other"
  ]),
  fullName: type.string(),
  compactName: type.string(),
  miniName: type.string(),
  sidebarUseOfficer: type.boolean()
});

export default Position
