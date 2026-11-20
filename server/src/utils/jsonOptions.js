export const jsonOptions = {
varsionKey:false,
transform(doc,ret){
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash
    return ret
}
}