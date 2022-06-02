import { Modal } from 'components/modal/Modal';
import { useMemo, useState } from 'react';
import { ContractsApi } from 'services/web3/v3/contractsApi';
import { updatePortfolioData } from 'services/web3/v3/portfolio/helpers';
import { ExternalHolding } from 'elements/earn/portfolio/v3/externalHoldings/externalHoldings.types';
import { useAppSelector } from 'store';
import { useDispatch } from 'react-redux';
import { Button } from 'components/button/Button';
import { TokenBalance } from 'components/tokenBalance/TokenBalance';
import { useApproveModal } from 'hooks/useApproveModal';
import { mockToken } from 'utils/mocked';
import { getMigrateFnByAmmProvider } from 'elements/earn/portfolio/v3/externalHoldings/externalHoldings';
import { shrinkToken } from 'utils/formulas';
import { ProtectedSettingsV3 } from 'components/protectedSettingsV3/ProtectedSettingsV3';

interface Props {
  position: ExternalHolding;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const V3ExternalHoldingsModal = ({
  position,
  isOpen,
  setIsOpen,
}: Props) => {
  const [txBusy, setTxBusy] = useState(false);
  const account = useAppSelector((state) => state.user.account);
  const dispatch = useDispatch();

  const tokensToApprove = useMemo(
    () => [
      {
        token: {
          ...mockToken,
          address: position.poolTokenAddress,
          symbol: 'lpTKN',
        },
        amount: shrinkToken(position.poolTokenBalanceWei, 18),
      },
    ],
    [position.poolTokenAddress, position.poolTokenBalanceWei]
  );

  const migrate = async () => {
    if (!account) {
      console.error('No account found, please login');
      return;
    }

    const migrateFn = getMigrateFnByAmmProvider(position.ammKey);
    if (!migrateFn) {
      console.error('getMigrateFnByAmmProvider returned undefined');
      return;
    }

    try {
      const res = await migrateFn(
        position.tokens[0].address,
        position.tokens[1]?.address ?? position.nonBancorTokens[0].tokenAddress,
        position.poolTokenBalanceWei
      );
      await res.wait();
      setIsOpen(false);
      await updatePortfolioData(dispatch);
    } catch (e) {
      console.error(e);
    } finally {
      setTxBusy(false);
    }
  };

  const [onStart, ApproveModal] = useApproveModal(
    tokensToApprove,
    migrate,
    ContractsApi.BancorPortal.contractAddress
  );

  const handleButtonClick = async () => {
    setTxBusy(true);
    onStart();
  };

  return (
    <Modal title={'Migrate'} setIsOpen={setIsOpen} isOpen={isOpen} large>
      <div className="p-30 pt-0">
        <h2 className="text-[24px] leading-9">
          Protect this {position.ammName} holding from impermanent loss
        </h2>

        <p className="mt-16 mb-20 text-secondary">
          {position.rektStatus === 'At risk'
            ? 'Your position is at risk of impermanent loss'
            : `You’ve lost ${position.rektStatus} in impermanent loss so far`}
          , get 100% protected on Bancor.
        </p>

        <h3 className="mb-10">Moving to Bancor</h3>

        <div className="bg-fog dark:bg-grey p-20 rounded space-y-20">
          {position.tokens.map((t) => (
            <div key={t.address}>
              <TokenBalance
                symbol={t.symbol}
                amount={t.balance || '0'}
                usdPrice={t.usdPrice}
                imgUrl={t.logoURI}
              />
            </div>
          ))}
        </div>

        <h3 className="mb-10">Exit risky position and move to your wallet</h3>
        <div className="space-y-20">
          {position.nonBancorTokens.map((t) => (
            <div key={t.tokenAddress}>
              {t.tokenCurrentBalance} {t.tokenName}
            </div>
          ))}
        </div>

        <Button
          onClick={handleButtonClick}
          className="w-full mt-20"
          disabled={txBusy}
        >
          {txBusy ? '... waiting for confirmation' : 'Migrate and Protect'}
        </Button>

        <ProtectedSettingsV3 />

        {ApproveModal}
      </div>
    </Modal>
  );
};
