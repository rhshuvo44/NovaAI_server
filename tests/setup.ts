beforeAll(async () => {
    await connectDatabase();

    await PermissionModel.deleteMany({});
    await RoleModel.deleteMany({});

    for (const permission of PERMISSION_SEEDS) {
        await PermissionModel.create(permission);
    }

    for (const role of ROLE_SEEDS) {
        await RoleModel.create(role);
    }
});