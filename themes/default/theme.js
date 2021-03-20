class Theme_default extends Theme {
    async init(manifest) {
        await super.init(manifest)
        this.log('initialized')
    }
}