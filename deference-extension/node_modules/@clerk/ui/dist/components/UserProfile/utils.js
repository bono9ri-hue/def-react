//#region src/components/UserProfile/utils.ts
const currentSessionFirst = (id) => (a) => a.id === id ? -1 : 1;
function sortIdentificationBasedOnVerification(array, primaryId) {
	if (!array) return [];
	const primaryItem = array.filter((item) => item.id === primaryId);
	const itemsWithoutPrimary = array.filter((item) => item.id !== primaryId);
	const verifiedItems = itemsWithoutPrimary.filter((item) => item.verification?.status === "verified");
	const unverifiedItems = itemsWithoutPrimary.filter((item) => !!item.verification?.status && item.verification?.status !== "verified");
	const unverifiedItemsWithoutVerification = itemsWithoutPrimary.filter((item) => !item.verification.status);
	verifiedItems.sort((a, b) => a.id.localeCompare(b.id));
	unverifiedItems.sort((a, b) => {
		if (!a.verification?.expireAt || !b.verification?.expireAt) return 0;
		return a.verification.expireAt.getTime() - b.verification.expireAt.getTime();
	});
	return [
		...primaryItem,
		...verifiedItems,
		...unverifiedItems,
		...unverifiedItemsWithoutVerification
	];
}

//#endregion
export { currentSessionFirst, sortIdentificationBasedOnVerification };
//# sourceMappingURL=utils.js.map