import React, { useState, useEffect, useContext, useCallback } from "react";

import {
  Box,
  SimpleGrid,
  Skeleton,
  Flex,
  Text,
  Link,
  Button,
  Image,
  Tooltip,
} from "@chakra-ui/react";

import BigNumber from "bignumber.js";

import { TezosContext } from "./context/TezosContext";

import Header from "./components/header";
import SelectOven from "./components/ovens/select-oven";
import Oven from "./components/ovens/oven";
import MainForm from "./components/main-form";
import Preview from "./components/preview";

import {
  fetchAllOvensOfAddress,
  loadOvenData,
  estimateKUSDtoTEZ,
  executeLeverage,
} from "./lib/kolibri";

import Logo from "./assets/tezos.png";

const STATES = Object.freeze({
  NOT_CONNECTED: 0,
  CONNECTED: 1, // SELECTED OVEN AND GOOD TO GO.
  LOAD_OVENS: 2,
  MULTIPLE_OVENS: 3,
  NO_OVEN: 4,
});

function withSlippage(value, slippage) {
  return value.times(BigNumber(100).minus(slippage)).idiv(100);
}

function App({ connectWallet }) {
  const [current, setCurrent] = useState(STATES.NOT_CONNECTED);
  const [address, setAddress] = useState("");

  const [isPreviewAllowed, setIsPreviewAllowed] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [executing, setExecuting] = useState(false);

  const [ovens, setOvens] = useState([]);
  const [selectedOven, setSelectedOven] = useState("");
  const [ovenData, setOvenData] = useState();
  const [tezBalance, setTEZBalance] = useState();
  // const [xtzPrice, setXTZPrice] = useState();

  const [collateralToAdd, setCollateralToAdd] = useState("");
  const [kusdToBorrow, setKUSDToBorrow] = useState("");

  const [previewData, setPreviewData] = useState({});

  const walletConnected = !!address;

  const { wallet, tezos } = useContext(TezosContext);

  useEffect(() => {
    // fetchTezPrice().then(setXTZPrice);
    if (!walletConnected) return;
    if (address) tezos.tz.getBalance(address).then((bal) => setTEZBalance(bal));
    if (current === STATES.LOAD_OVENS) {
      fetchAllOvensOfAddress(address).then((ovensFound) => {
        setOvens(ovensFound);
        if (ovensFound.length === 0) {
          setCurrent(STATES.NO_OVEN);
          return;
        }
        if (ovensFound.length === 1) {
          setSelectedOven(ovensFound[0]);
          setCurrent(STATES.CONNECTED);
          return;
        }

        setCurrent(STATES.MULTIPLE_OVENS);
      });
    }
  }, [current, tezos, address, walletConnected]);

  useEffect(() => {
    if (!!selectedOven) {
      loadOvenData(tezos, selectedOven).then(setOvenData);
    }
  }, [selectedOven, tezos]);

  async function connectWallet() {
    let walletAddress;

    const activeAccount = await wallet.client.getActiveAccount();
    if (activeAccount) {
      walletAddress = activeAccount.address;
    } else {
      const permissions = await wallet.client.requestPermissions();
      walletAddress = permissions.address;
    }
    setAddress(walletAddress);
    setCurrent(STATES.LOAD_OVENS);
  }

  async function disconnectWallet() {
    await wallet.client.clearActiveAccount();
    setCurrent(STATES.NOT_CONNECTED);
    setAddress("");
  }

  useEffect(() => {
    if (showPreview) {
      if (!kusdToBorrow) return;
      if (!collateralToAdd) setCollateralToAdd(0);

      /**
       * Preview Data
       * - collateral to add
       * - kusd to borrow
       * - xtz received from kusd
       * - total collateral to add
       * - leverage
       * - total collateral
       * - total borrowed
       */

      let data = {};
      data["collateralToAdd"] = new BigNumber(collateralToAdd).times(1e6);
      data["kusdToBorrow"] = new BigNumber(kusdToBorrow).times(1e18);

      data["fee"] = data["collateralToAdd"].div(100);
      data["collateralToAdd"] = data["collateralToAdd"].minus(data["fee"]);

      estimateKUSDtoTEZ(tezos, data["kusdToBorrow"]).then((teztimate) => {
        data["swappedXTZ"] = withSlippage(teztimate, 1);
        data["totalCollateralToAdd"] = data["collateralToAdd"].plus(
          data["swappedXTZ"]
        );
        // TODO
        data["leverage"] = data["totalCollateralToAdd"].div(
          data["collateralToAdd"]
        );

        data["totalCollateral"] = ovenData.collateral.plus(
          data["totalCollateralToAdd"]
        );
        data["totalBorrowed"] = ovenData.borrowed.plus(data["kusdToBorrow"]);

        data["collateralUSD"] = data["totalCollateral"]
          .div(1e6)
          .times(ovenData.usd.tez);
        data["borrowedUSD"] = data["totalBorrowed"]
          .div(1e18)
          .times(ovenData.usd.kusd);
        data["collRatio"] = data["collateralUSD"]
          .div(data["borrowedUSD"])
          .times(100)
          .toNumber()
          ? data["collateralUSD"].div(data["borrowedUSD"]).times(100).toNumber()
          : 0;

        data["collUtilization"] = data["borrowedUSD"]
          .div(data["collateralUSD"].div(2))
          .times(100)
          .toNumber()
          ? data["borrowedUSD"]
              .div(data["collateralUSD"].div(2))
              .times(100)
              .toNumber()
          : 0;

        data["liqPrice"] = data["borrowedUSD"]
          .times(2)
          .div(data["totalCollateral"].div(1e6))
          .toNumber()
          ? data["borrowedUSD"]
              .times(2)
              .div(data["totalCollateral"].div(1e6))
              .toNumber()
          : 0;
        console.log(data["liqPrice"].toString());
        setPreviewData(data);
        setOpenPreview(true);
        setShowPreview(false);
      });
    }
  }, [
    showPreview,
    collateralToAdd,
    kusdToBorrow,
    tezos,
    ovenData?.collateral,
    ovenData?.borrowed,
    ovenData?.usd?.tez,
    ovenData?.usd?.kusd,
  ]);

  const computeIsPreviewAllowed = useCallback(() => {
    if (!collateralToAdd || !kusdToBorrow) return false;
    if (!tezBalance) return false;
    if (new BigNumber(collateralToAdd).times(1e6).gte(tezBalance)) return false;

    return true;
  }, [collateralToAdd, kusdToBorrow, tezBalance]);

  useEffect(() => {
    setIsPreviewAllowed(computeIsPreviewAllowed());
  }, [computeIsPreviewAllowed]);

  return (
    <Flex minW="100vw" minH="100vh" flexDir={"column"}>
      {openPreview && previewData && (
        <Preview
          previewData={previewData}
          execute={() => {
            setExecuting(true);
            executeLeverage(
              tezos,
              selectedOven,
              previewData.collateralToAdd,
              previewData.kusdToBorrow,
              previewData.swappedXTZ,
              previewData.fee,
              address
            ).then((res) => {
              setExecuting(false);
              setOpenPreview(false);
              setPreviewData({});
              setOvenData(null);
              loadOvenData(tezos, selectedOven).then(setOvenData);
            });
          }}
          isExecuting={executing}
          close={() => {
            setOpenPreview(false);
            setPreviewData({});
          }}
        />
      )}
      <Header
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        address={address}
        tezBalance={tezBalance}
      />
      <Box
        px={8}
        py={12}
        overflow="hidden"
        h="100%"
        flexGrow={"1"}
        bgGradient="linear(to-r, #020436, black)"
      >
        {current === STATES.NOT_CONNECTED && (
          <Flex>
            <Flex justifyContent={"left"} alignItems={"center"}>
              <Box
                textAlign={"left"}
                maxW="container.md"
                py={40}
                marginLeft="px"
              >
                <Text
                  fontSize={"5xl"}
                  fontWeight="black"
                  color={"blue.700"}
                  display="block"
                >
                  Put your{" "}
                  <Text
                    as="span"
                    bgClip="text"
                    bgGradient="linear(to-r, green.700, green.400)"
                  >
                    $XTZ
                  </Text>{" "}
                  to work with Leveraged Trading 🚀
                </Text>
                <br />
                <Text color="gray.300">
                  One-stop dashboard to track, create and manage your positions
                </Text>
                <br />
                <Button
                  colorScheme="green"
                  bgGradient="linear(to-r, green.700, green.400)"
                  onClick={connectWallet}
                >
                  Get Started
                </Button>
              </Box>
            </Flex>
            <Box
              w={{ lg: "60%", md: "" }}
              mb={{ base: 12, md: 0 }}
              position="relative"
              bottom="0"
              right="0"
              mr={{ lg: 14 }}
            >
              <Image
                zIndex="0"
                filter="blur(16px)"
                transform="scale(1.1, 1.1)"
                boxSize="500px"
                pointerEvents="none"
                userSelect="none"
                rounded="md"
                src={Logo}
                alt="TezosLogo"
                position="absolute"
                top="10%"
                bottom="10%"
                right="5%"
              />
              <Image
                zIndex="0"
                transform="scale(1.1, 1.1)"
                boxSize="500px"
                pointerEvents="none"
                userSelect="none"
                rounded="md"
                src={Logo}
                alt="TezosLogo"
                position="absolute"
                top="10%"
                bottom="10%"
                right="5%"
              />
            </Box>
          </Flex>
        )}
        {/* TODO: Design a component to show that yo dude you have no ovens and go make one on Kolibri */}
        {current === STATES.NO_OVEN && (
          <>
            <Flex mb="30px">
              <Button
                colorScheme="blue"
                variant="solid"
                mb="8px"
                marginRight="4px"
                borderEndRadius
              >
                Long
              </Button>

              <Tooltip label="Coming Soon !">
                <Flex>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    mb="8px"
                    disabled
                    textColor="blue.200"
                  >
                    Short
                  </Button>
                </Flex>
              </Tooltip>
            </Flex>
            <Flex
              p={8}
              borderRadius={"10px"}
              boxShadow="sm"
              border={"1px"}
              borderColor="gray.300"
              alignItems={"center"}
              justifyContent={"space-between"}
              maxW={"container.md"}
              mx={"auto"}
            >
              <Box>
                <Text fontSize={"xl"} fontWeight={"bold"} color="gray.300">
                  Uh oh, no{" "}
                  <Link
                    href="https://kolibri.finance"
                    target={"_blank"}
                    color="green.500"
                    fontWeight={"semibold"}
                  >
                    Kolibri
                  </Link>{" "}
                  Ovens found.
                </Text>
                <Text color="gray.300">
                  Please head over to{" "}
                  <Link
                    href="https://kolibri.finance"
                    target={"_blank"}
                    color="green.500"
                  >
                    Kolibri
                  </Link>{" "}
                  and create an oven.
                </Text>
              </Box>
              <Link href="https://kolibri.finance" target={"_blank"}>
                <Button colorScheme={"blue"}>Create an Oven</Button>
              </Link>
            </Flex>
          </>
        )}
        {current === STATES.MULTIPLE_OVENS && (
          <>
            <Flex mb="30px">
              <Button
                colorScheme="blue"
                variant="solid"
                mb="8px"
                marginRight="4px"
                borderEndRadius
              >
                Long
              </Button>

              <Tooltip label="Coming Soon !">
                <Flex>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    mb="8px"
                    disabled
                    textColor="blue.200"
                  >
                    Short
                  </Button>
                </Flex>
              </Tooltip>
            </Flex>

            <SelectOven
              ovens={ovens}
              setSelected={setSelectedOven}
              afterSelect={() => setCurrent(STATES.CONNECTED)}
            />
          </>
        )}
        {current === STATES.CONNECTED && (
          <>
            <Flex mb='30px'>
              <Button
                colorScheme="blue"
                variant="solid"
                mb="8px"
                marginRight="4px"
                borderEndRadius
              >
                Long
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                mb="8px"
                disabled
                textColor="blue.200"
              >
                Short
              </Button>
            </Flex>

            <Text
              fontSize="3xl"
              fontWeight="bold"
              color="gray.400"
              marginBottom="6px"
            >
              Go long on your assets{" "}
            </Text>
            <Text color="gray.400" fontSize="l">
              In a long (buy) position, the user/buyer is hoping for the price
              to rise.
              <br /> An investor in a long position will profit from a rise in
              price
            </Text>
            <SimpleGrid
              mt="40px"
              minChildWidth={{ lg: "100px", md: "" }}
              spacing={6}
              startColor="gray.600"
              endColor="gray.900"
              rounded="10px"
            >
              <Oven address={selectedOven} data={ovenData} />
              <Skeleton
                isLoaded={!!ovenData}
                startColor="gray.600"
                endColor="gray.900"
                rounded="10px"
              >
                <MainForm
                  setCollateralToAdd={setCollateralToAdd}
                  setKUSDToBorrow={setKUSDToBorrow}
                  setShowPreview={setShowPreview}
                  loadingPreview={showPreview}
                  allowPreview={isPreviewAllowed}
                />
              </Skeleton>
            </SimpleGrid>
          </>
        )}
      </Box>
      <Box
        px={8}
        py={4}
        borderTop={"1px"}
        borderColor="black.600"
        bgGradient="linear(to-r, #020436, black)"
      >
        <Text color="gray.300" fontWeight="bold">
          This App is still in Beta. More features coming soon ✨
        </Text>
      </Box>
    </Flex>
  );
}

export default App;
