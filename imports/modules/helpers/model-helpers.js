export default function (Collection) {

    Collection.before.insert((userId, doc) => {
        doc.createdAt = new Date();
        doc.active = true;
    });

    Collection.before.update((userId, doc, fieldNames, modifier, options) => {
        modifier.$set = modifier.$set || {};
        modifier.$set.updatedAt = new Date();
    });

    Collection.before.find((userId, selector, options) => {
        selector.active = true;
    });
}